// Script to check the roulette history database
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const DB_PATH = path.join(__dirname, '../..', 'data', 'roulette.db');
const db = new sqlite3.Database(DB_PATH);

// Function to get the latest results
function getLatestResults(limit = 10) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, roulette_id, result_number, result_color, created_at 
      FROM roulette_history 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    
    db.all(query, [limit], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Main function
async function main() {
  try {
    console.log('Checking database for latest results...');
    const results = await getLatestResults(10);
    
    if (results.length === 0) {
      console.log('No results found in the database.');
    } else {
      console.log('Latest results from database:');
      console.table(results);
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    // Close the database connection
    db.close();
  }
}

// Run the script
main().catch(console.error);
