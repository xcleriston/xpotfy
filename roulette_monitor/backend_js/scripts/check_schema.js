// Script to check the database schema
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const DB_PATH = path.join(__dirname, '../..', 'data', 'roulette.db');
const db = new sqlite3.Database(DB_PATH);

// Function to get table info
function getTableInfo(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        // If table doesn't exist, return null
        if (err.message.includes('no such table')) {
          resolve(null);
        } else {
          reject(err);
        }
      } else {
        resolve(rows);
      }
    });
  });
}

// Function to list all tables
function listTables() {
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'migrations'", (err, tables) => {
      if (err) reject(err);
      else resolve(tables.map(t => t.name));
    });
  });
}

// Main function
async function main() {
  try {
    console.log('Checking database schema...');
    
    // List all tables
    const tables = await listTables();
    console.log('\nTables in database:');
    console.table(tables);
    
    // Check schema of roulette_history if it exists
    if (tables.includes('roulette_history')) {
      console.log('\nSchema for roulette_history:');
      const schema = await getTableInfo('roulette_history');
      console.table(schema);
      
      // Get row count
      const count = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM roulette_history', (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
      
      console.log(`\nTotal rows in roulette_history: ${count}`);
      
      if (count > 0) {
        // Get sample data
        const sample = await new Promise((resolve, reject) => {
          db.all('SELECT * FROM roulette_history LIMIT 3', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
        
        console.log('\nSample data from roulette_history:');
        console.table(sample);
      }
    } else {
      console.log('\nroulette_history table does not exist');
    }
    
  } catch (error) {
    console.error('Error checking database schema:', error);
  } finally {
    // Close the database connection
    db.close();
  }
}

// Run the script
main().catch(console.error);
