require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'cars.db');
const db = new sqlite3.Database(dbPath);

// Helper wrappers to convert SQLite callbacks to Promises
const dbQuery = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }
};

// Initialize database tables
async function initDb() {
  try {
    // 1. Users Table
    await dbQuery.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT DEFAULT "",
        phone TEXT DEFAULT "",
        role TEXT DEFAULT "user"
      )
    `);

    // 2. Inquiries Table
    await dbQuery.run(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        carId TEXT NOT NULL,
        carTitle TEXT NOT NULL,
        carPrice TEXT DEFAULT "",
        date TEXT DEFAULT (datetime('now'))
      )
    `);

    // 3. Cars Table
    await dbQuery.run(`
      CREATE TABLE IF NOT EXISTS cars (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        price TEXT NOT NULL,
        details TEXT DEFAULT "",
        photos TEXT DEFAULT "[]",
        date TEXT DEFAULT (datetime('now')),
        link TEXT DEFAULT "#",
        isMock INTEGER DEFAULT 0
      )
    `);

    console.log('SQLite database tables initialized successfully.');

    // Seed admin if not present
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword2026';
    
    // SAFE: Parameterized SELECT query to check for existing admin
    const existingAdmin = await dbQuery.get('SELECT * FROM users WHERE username = ?', [adminUsername]);
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminId = 'admin-system-id';
      
      // SAFE: Parameterized INSERT query
      await dbQuery.run(
        'INSERT INTO users (id, username, password, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
        [adminId, adminUsername, hashedPassword, 'System Admin', '+251911000000', 'admin']
      );
      console.log('Seeded default admin user: admin / adminpassword2026');
    }
  } catch (err) {
    console.error('Error initializing SQLite database:', err);
  }
}

// Initialize on load
initDb();

module.exports = {
  db: dbQuery,
  rawDb: db
};
