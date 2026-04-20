import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Open SQLite database
const db = await open({
  filename: './automation.db',
  driver: sqlite3.Database
});

// Enable foreign keys
await db.run('PRAGMA foreign_keys = ON');

export default db;
