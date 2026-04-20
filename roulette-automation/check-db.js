import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function checkDatabase() {
  try {
    const db = await open({
      filename: './automation.db',
      driver: sqlite3.Database
    });

    console.log('Database connection successful!');
    
    // List all tables
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    
    console.log('\nTables in the database:');
    console.table(tables);
    
    // Check users table
    try {
      const users = await db.all('SELECT * FROM users');
      console.log('\nUsers:');
      console.table(users);
    } catch (err) {
      console.log('\nError querying users table:', err.message);
    }
    
    await db.close();
  } catch (err) {
    console.error('Database error:', err);
  }
}

checkDatabase();
