// Script to initialize the database with correct schema
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const DB_PATH = path.join(__dirname, '../..', 'data', 'roulette.db');
const db = new sqlite3.Database(DB_PATH);

// SQL to create roulette_history table if it doesn't exist
const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS roulette_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roulette_id TEXT NOT NULL,
    result_number INTEGER NOT NULL,
    result_color TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    patterns TEXT,
    UNIQUE(roulette_id, created_at) ON CONFLICT IGNORE
  )
`;

// SQL to create index for faster lookups
const CREATE_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_roulette_history_roulette_id 
  ON roulette_history(roulette_id, created_at DESC)
`;

// Function to initialize the database
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON');
      
      // Create roulette_history table
      db.run(CREATE_TABLE_SQL, (err) => {
        if (err) {
          console.error('Error creating roulette_history table:', err);
          return reject(err);
        }
        
        console.log('roulette_history table created or already exists');
        
        // Create index
        db.run(CREATE_INDEX_SQL, (err) => {
          if (err) {
            console.error('Error creating index:', err);
            return reject(err);
          }
          
          console.log('Index created successfully');
          resolve();
        });
      });
    });
  });
}

// Main function
async function main() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    db.close();
  }
}

// Run the script
main().catch(console.error);
