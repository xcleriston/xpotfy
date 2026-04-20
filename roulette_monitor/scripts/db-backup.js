const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const DB_PATH = path.join(__dirname, '../data/roulette.db');
const BACKUP_DIR = path.join(__dirname, '../backups');

// Create backups directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `roulette_${timestamp}.db`);
    
    console.log(`Creating backup to ${backupFile}...`);
    
    // Use sqlite3's .backup command to create a safe backup
    await execAsync(`sqlite3 ${DB_PATH} ".backup '${backupFile}'"`);
    
    console.log('Backup completed successfully!');
    console.log(`Backup saved to: ${backupFile}`);
    
    return backupFile;
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

// Run backup if this file is executed directly
if (require.main === module) {
  backupDatabase();
}

module.exports = backupDatabase;
