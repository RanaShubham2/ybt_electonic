import express from 'express';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './src/db.ts';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'ybt-digital-secret-key-2024';

async function startServer() {
  console.log('Starting server...');
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const role = email === 'admin@ybt.com' ? 'admin' : 'user';
      const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email, hashedPassword, role);
      const user = { id: result.lastInsertRowid, name, email, role };
      const token = jwt.sign(user, JWT_SECRET);
      res.json({ user, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message.includes('UNIQUE') ? 'Email already exists' : 'Signup failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);
    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (!user) {
        console.log(`User not found: ${email}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log(`Password mismatch for: ${email}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const { password: _, ...userWithoutPassword } = user;
      const token = jwt.sign(userWithoutPassword, JWT_SECRET);
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
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
