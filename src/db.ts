import sqlite3 from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { SEED_PRODUCTS } from './seedData';

const db = new sqlite3('database.sqlite');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT NOT NULL,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    total_amount REAL NOT NULL,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  );

  CREATE TABLE IF NOT EXISTS support_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrations for existing tables
try {
  db.prepare("ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'active'").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE orders ADD COLUMN transaction_id TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE order_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1").run();
} catch (e) {}

// Seed initial data
try {
  const adminExists = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');
  if (!adminExists) {
    console.log('Seeding admin user...');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      'Admin User',
      'admin@ybt.com',
      hashedPassword,
      'admin'
    );
  }

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  const hasLatestProducts = db.prepare("SELECT COUNT(*) as count FROM products WHERE image_url LIKE '%photo-1617043786394-f977fa12eddf%'").get() as { count: number };
  
  if (productCount.count < SEED_PRODUCTS.length || hasLatestProducts.count === 0) {
    console.log('Force re-seeding expanded catalog to fix duplicate images...');
    db.prepare('DELETE FROM order_items').run();
    db.prepare('DELETE FROM products').run(); 
    
    const insertProduct = db.prepare('INSERT INTO products (title, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)');
    
    for (const p of SEED_PRODUCTS) {
      insertProduct.run(p.title, p.description, p.price, p.category, p.image_url);
    }
  }

  // Force update the Apple Watch image if it's the old broken one
  db.prepare("UPDATE products SET image_url = 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80' WHERE title = 'Apple Watch Ultra 2'").run();
} catch (error) {
  console.error('Database initialization error:', error);
}

export default db;
