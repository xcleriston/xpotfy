const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const readdir = promisify(fs.readdir);
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const DB_PATH = path.join(__dirname, '../data/roulette.db');
const BACKUP_DIR = path.join(__dirname, '../backups');

async function listBackups() {
  try {
    const files = await readdir(BACKUP_DIR);
    return files
      .filter(file => file.endsWith('.db') && file.startsWith('roulette_'))
      .sort()
      .reverse();
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('Backup directory not found. No backups available.');
    } else {
      console.error('Error listing backups:', error);
    }
    process.exit(1);
  }
}

async function restoreDatabase(backupFile) {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFile);
    
    if (!fs.existsSync(backupPath)) {
      console.error(`Backup file not found: ${backupPath}`);
      process.exit(1);
    }
    
    console.log(`Restoring database from ${backupFile}...`);
    
    // Close any existing connections and restore from backup
    await execAsync(`sqlite3 ${DB_PATH} ".restore '${backupPath}'"`);
    
    console.log('Database restored successfully!');
  } catch (error) {
    console.error('Restore failed:', error);
    process.exit(1);
  } finally {
    readline.close();
  }
}

async function promptForBackup(backups) {
  console.log('\nAvailable backups:');
  backups.forEach((file, index) => {
    console.log(`[${index + 1}] ${file}`);
  });
  
  readline.question('\nEnter the number of the backup to restore (or press Enter to cancel): ', (answer) => {
    if (!answer.trim()) {
      console.log('Restore cancelled.');
      process.exit(0);
    }
    
    const index = parseInt(answer) - 1;
    if (isNaN(index) || index < 0 || index >= backups.length) {
      console.error('Invalid selection. Please try again.');
      promptForBackup(backups);
    } else {
      restoreDatabase(backups[index]);
    }
  });
}

// Run restore if this file is executed directly
if (require.main === module) {
  (async () => {
    const backups = await listBackups();
    
    if (backups.length === 0) {
      console.log('No backup files found.');
      process.exit(0);
    }
    
    promptForBackup(backups);
  })();
}

module.exports = {
  restoreDatabase,
  listBackups
};
