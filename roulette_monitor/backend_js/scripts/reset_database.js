// Script to reset and initialize the database with correct schema
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const DB_PATH = path.join(__dirname, '../..', 'data', 'roulette.db');
const db = new sqlite3.Database(DB_PATH);

// SQL to drop existing table if it exists
const DROP_TABLE_SQL = `
  DROP TABLE IF EXISTS roulette_history
`;

// SQL to create roulette_history table
const CREATE_TABLE_SQL = `
  CREATE TABLE roulette_history (
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
  CREATE INDEX idx_roulette_history_roulette_id 
  ON roulette_history(roulette_id, created_at DESC)
`;

// Function to reset and initialize the database
async function resetDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = OFF');
      
      // Drop existing table
      console.log('Dropping existing roulette_history table if it exists...');
      db.run(DROP_TABLE_SQL, (err) => {
        if (err) {
          console.error('Error dropping roulette_history table:', err);
          return reject(err);
        }
        
        console.log('Creating new roulette_history table...');
        // Create roulette_history table
        db.run(CREATE_TABLE_SQL, (err) => {
          if (err) {
            console.error('Error creating roulette_history table:', err);
            return reject(err);
          }
          
          console.log('Creating index on roulette_history table...');
          // Create index
          db.run(CREATE_INDEX_SQL, (err) => {
            if (err) {
              console.error('Error creating index:', err);
              return reject(err);
            }
            
            console.log('Database reset and initialized successfully');
            resolve();
          });
        });
      });
    });
  });
}

// Main function
async function main() {
  try {
    console.log('Resetting database...');
    await resetDatabase();
    console.log('Database reset completed successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    db.close();
  }
}

// Run the script
main().catch(console.error);
