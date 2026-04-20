const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database configuration
const DB_PATH = path.join(__dirname, '../../data/roulette.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Check if table exists
console.log('Checking if roulette_history table exists...');
db.get(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='roulette_history'",
  (err, row) => {
    if (err) {
      console.error('Error checking for table:', err.message);
      db.close();
      return;
    }
    
    if (row) {
      console.log('roulette_history table exists');
      
      // Get row count
      db.get("SELECT COUNT(*) as count FROM roulette_history", (err, result) => {
        if (err) {
          console.error('Error getting row count:', err.message);
        } else {
          console.log(`Total rows in roulette_history: ${result.count}`);
          
          // Get latest 5 rows
          if (result.count > 0) {
            db.all(
              "SELECT game_id, round_id, result_number, result_color, created_at FROM roulette_history ORDER BY created_at DESC LIMIT 5",
              (err, rows) => {
                if (err) {
                  console.error('Error fetching rows:', err.message);
                } else {
                  console.log('\nLatest 5 rows:');
                  console.table(rows);
                }
                db.close();
              }
            );
          } else {
            db.close();
          }
        }
      });
    } else {
      console.log('roulette_history table does not exist');
      db.close();
    }
  }
);
