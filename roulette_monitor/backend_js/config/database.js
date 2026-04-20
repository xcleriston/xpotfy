const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');
const { createTables } = require('../database/schema');

const DB_PATH = path.join(__dirname, '../../data/roulette.db');

// Create database directory if it doesn't exist
const fs = require('fs');
const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    logger.error('Error connecting to SQLite database:', err.message);
  } else {
    logger.info('Connected to SQLite database');
  }
});

// Enable foreign keys
const enableForeignKeys = () => {
  return new Promise((resolve, reject) => {
    db.get('PRAGMA foreign_keys = ON', [], (err) => {
      if (err) {
        logger.error('Error enabling foreign keys:', err.message);
        reject(err);
      } else {
        logger.info('Foreign key constraints enabled');
        resolve();
      }
    });
  });
};

// Initialize database tables
const initialize = async () => {
  try {
    await enableForeignKeys();
    await createTables(db);
    await createAdminUser();
  } catch (error) {
    logger.error('Error initializing database:', error);
    throw error;
  }
};

// Create admin user if it doesn't exist
const createAdminUser = () => {
  return new Promise((resolve, reject) => {
    const bcrypt = require('bcryptjs');
    const adminUser = {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin'
    };

    // Check if admin user already exists
    db.get('SELECT * FROM users WHERE username = ?', [adminUser.username], async (err, row) => {
      if (err) {
        logger.error('Error checking for admin user:', err.message);
        return reject(err);
      }

      if (!row) {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminUser.password, salt);
        
        // Create admin user
        db.run(
          'INSERT INTO users (id, username, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
          [
            require('crypto').randomUUID(),
            adminUser.username,
            hashedPassword,
            adminUser.role,
            new Date().toISOString()
          ],
          (err) => {
            if (err) {
              logger.error('Error creating admin user:', err.message);
              return reject(err);
            }
            logger.info('Admin user created successfully');
            resolve();
          }
        );
      } else {
        logger.info('Admin user already exists');
        resolve();
      }
    });
  });
};

module.exports = {
  db,
  initialize,
  getDb: () => db
};
