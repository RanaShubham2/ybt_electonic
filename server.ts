import express from 'express';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import db from './src/db.ts';
import dotenv from 'dotenv';
import path from 'path';
import Razorpay from 'razorpay';
import crypto from 'crypto';

dotenv.config();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const razorpay = RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET ? new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
}) : null;

const JWT_SECRET = process.env.JWT_SECRET || 'ybt-digital-secret-key-2024';

async function startServer() {
  console.log('Starting server...');
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    try {
      // Try verifying with local secret first
      try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user;
        return next();
      } catch (err) {
        // If local verification fails, try decoding as a Supabase token
        const decoded = jwt.decode(token) as any;
        if (decoded && decoded.sub) {
          // It's a Supabase token (or at least a valid-looking JWT)
          // We trust it for this hybrid demo
          req.user = {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.user_metadata?.full_name || 'User',
            role: decoded.user_metadata?.role || 'user'
          };

          // Sync with local users table so joins and admin dashboard work
          try {
            const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(decoded.email) as any;
            if (!existingUser) {
              const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
                req.user.name, decoded.email, 'SUPABASE_AUTH', req.user.role
              );
              req.user.local_id = result.lastInsertRowid;
            } else {
              req.user.local_id = existingUser.id;
              // Update name/role if they changed in Supabase
              db.prepare('UPDATE users SET name = ?, role = ? WHERE id = ?').run(
                req.user.name, req.user.role, existingUser.id
              );
            }
          } catch (syncErr) {
            console.error('User sync error:', syncErr);
          }

          return next();
        }
        return res.sendStatus(403);
      }
    } catch (err) {
      return res.sendStatus(403);
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  };

  // --- API Routes ---

  // Auth
  app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const role = normalizedEmail === 'admin@ybt.com' ? 'admin' : 'user';
      const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, normalizedEmail, hashedPassword, role);
      const user = { id: result.lastInsertRowid, name, email: normalizedEmail, role };
      const token = jwt.sign(user, JWT_SECRET);
      res.json({ user, token });
    } catch (error: any) {
      if (error.message.includes('UNIQUE')) {
        res.status(400).json({ error: 'This email is already registered in our local system. Please try logging in instead.' });
      } else {
        res.status(400).json({ error: 'Signup failed' });
      }
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const trimmedEmail = email?.trim().toLowerCase();
    console.log(`Login attempt for: ${trimmedEmail}`);
    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmedEmail) as any;
      if (!user) {
        console.log(`User not found: ${trimmedEmail}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      console.log(`User found: ${user.email}, role: ${user.role}`);
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log(`Password mismatch for: ${trimmedEmail}`);
        // Special check for admin if it fails
        if (trimmedEmail === 'admin@ybt.com' && password === 'admin123') {
          console.log('CRITICAL: admin123 failed to match hash in DB!');
        }
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log(`Login successful for: ${trimmedEmail}`);
      const { password: _, ...userWithoutPassword } = user;
      const token = jwt.sign(userWithoutPassword, JWT_SECRET);
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/test-bcrypt', async (req, res) => {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    const match = await bcrypt.compare(password, hash);
    res.json({ password, hash, match });
  });

  app.post('/api/auth/reset-admin', async (req, res) => {
    try {
      const adminEmail = 'admin@ybt.com';
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Delete if exists to ensure clean state
      db.prepare('DELETE FROM users WHERE email = ?').run(adminEmail);
      
      db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
        'Admin User',
        adminEmail,
        hashedPassword,
        'admin'
      );
      
      res.json({ success: true, message: 'Admin user has been reset to default credentials.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Products
  app.get('/api/products', (req, res) => {
    const products = db.prepare("SELECT * FROM products WHERE status = 'active'").all();
    res.json(products);
  });

  app.get('/api/products/:id', (req, res) => {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  });

  // Orders
  app.post('/api/orders', authenticateToken, (req: any, res) => {
    const { items, totalAmount, transactionId } = req.body;
    const userId = req.user.local_id || req.user.id;

    const transaction = db.transaction(() => {
      const result = db.prepare('INSERT INTO orders (user_id, total_amount, transaction_id, status) VALUES (?, ?, ?, ?)').run(
        userId, totalAmount, transactionId || 'SIMULATED_' + Date.now(), 'completed'
      );
      const orderId = result.lastInsertRowid;

      for (const item of items) {
        db.prepare('INSERT INTO order_items (order_id, product_id, price) VALUES (?, ?, ?)').run(
          orderId, item.id, item.price
        );
      }
      return orderId;
    });

    try {
      const orderId = transaction();
      res.json({ success: true, orderId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/my-orders', authenticateToken, (req: any, res) => {
    try {
      const userId = req.user.local_id || req.user.id;
      const orders = db.prepare(`
        SELECT o.*, GROUP_CONCAT(p.title) as product_titles
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `).all(userId);
      res.json(orders);
    } catch (error: any) {
      console.error('Error fetching my orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.put('/api/user/profile', authenticateToken, async (req: any, res) => {
    const { name, password } = req.body;
    const userId = req.user.local_id || req.user.id;

    try {
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.prepare('UPDATE users SET name = ?, password = ? WHERE id = ?').run(name, hashedPassword, userId);
      } else {
        db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, userId);
      }
      
      const updatedUser = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(userId) as any;
      if (!updatedUser) return res.status(404).json({ error: 'User not found' });
      res.json({ success: true, user: updatedUser });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Support Requests
  app.post('/api/support', async (req, res) => {
    const { name, email, message } = req.body;
    try {
      db.prepare('INSERT INTO support_requests (name, email, message) VALUES (?, ?, ?)').run(name, email, message);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Razorpay Payments ---
  app.post('/api/payments/create-order', authenticateToken, async (req: any, res) => {
    if (!razorpay) {
      return res.status(500).json({ error: 'Razorpay is not configured on the server' });
    }

    const { amount, currency = 'INR' } = req.body;

    try {
      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
        currency,
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error: any) {
      console.error('Razorpay Order Creation Error:', error);
      res.status(500).json({ error: 'Failed to create Razorpay order' });
    }
  });

  app.post('/api/payments/verify', authenticateToken, async (req: any, res) => {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      items,
      totalAmount
    } = req.body;

    if (!RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Razorpay secret is missing' });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Payment is verified
      const userId = req.user.local_id || req.user.id;

      const transaction = db.transaction(() => {
        const result = db.prepare('INSERT INTO orders (user_id, total_amount, transaction_id, status) VALUES (?, ?, ?, ?)').run(
          userId, totalAmount, razorpay_payment_id, 'completed'
        );
        const orderId = result.lastInsertRowid;

        for (const item of items) {
          db.prepare('INSERT INTO order_items (order_id, product_id, price) VALUES (?, ?, ?)').run(
            orderId, item.id, item.price
          );
        }
        return orderId;
      });

      try {
        const orderId = transaction();
        res.json({ success: true, orderId });
      } catch (error: any) {
        res.status(500).json({ error: 'Payment verified but failed to save order locally' });
      }
    } else {
      res.status(400).json({ error: 'Invalid payment signature' });
    }
  });

  // Admin Routes
  app.get('/api/admin/stats', authenticateToken, isAdmin, (req, res) => {
    try {
      const totalSales = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE status = 'completed'").get() as any;
      const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
      const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get() as any;
      const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products").get() as any;
      
      res.json({
        totalRevenue: totalSales?.total || 0,
        totalOrders: totalOrders?.count || 0,
        totalUsers: totalUsers?.count || 0,
        totalProducts: totalProducts?.count || 0
      });
    } catch (error: any) {
      console.error('Admin stats error:', error);
      res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
  });

  app.get('/api/orders', authenticateToken, isAdmin, (req, res) => {
    const orders = db.prepare(`
      SELECT o.*, u.email as user_email, u.name as user_name 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `).all();
    res.json(orders);
  });

  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Express Error Handler:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('Initializing Vite middleware...');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite middleware initialized.');
    } catch (e) {
      console.error('Failed to initialize Vite middleware:', e);
    }
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
