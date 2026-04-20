const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class Migrator {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/roulette.db');
    this.migrationsDir = path.join(__dirname, 'migrations');
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) return reject(err);
        this.ensureMigrationsTable().then(resolve).catch(reject);
      });
    });
  }

  async ensureMigrationsTable() {
    return new Promise((resolve, reject) => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async getExecutedMigrations() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT name FROM migrations ORDER BY id', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => row.name));
      });
    });
  }

  async getPendingMigrations() {
    const executed = await this.getExecutedMigrations();
    const allFiles = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    return allFiles.filter(file => !executed.includes(file));
  }

  async runMigration(migrationFile) {
    const migrationPath = path.join(this.migrationsDir, migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        // Execute migration SQL
        this.db.exec(sql, (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            return reject(err);
          }
          
          // Record migration
          this.db.run(
            'INSERT INTO migrations (name) VALUES (?1)',
            [migrationFile],
            (err) => {
              if (err) {
                this.db.run('ROLLBACK');
                return reject(err);
              }
              this.db.run('COMMIT', (err) => {
                if (err) return reject(err);
                console.log(`Applied migration: ${migrationFile}`);
                resolve();
              });
            }
          );
        });
      });
    });
  }

  async migrate() {
    try {
      await this.connect();
      const pendingMigrations = await this.getPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        console.log('No pending migrations.');
        return;
      }
      
      console.log(`Found ${pendingMigrations.length} pending migrations.`);
      
      for (const migration of pendingMigrations) {
        console.log(`Running migration: ${migration}`);
        await this.runMigration(migration);
      }
      
      console.log('All migrations completed successfully.');
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    } finally {
      if (this.db) {
        this.db.close();
      }
    }
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  const migrator = new Migrator();
  migrator.migrate();
}

module.exports = Migrator;
