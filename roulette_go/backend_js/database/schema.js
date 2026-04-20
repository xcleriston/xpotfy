const createTables = (db) => {
  return new Promise((resolve, reject) => {
    // Create users table
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TEXT NOT NULL,
          updated_at TEXT
        )
      `);

      // Tickets table
      db.run(`
        CREATE TABLE IF NOT EXISTS tickets (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          credits INTEGER NOT NULL DEFAULT 100,
          cost_per_interaction INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Bet rounds table
      db.run(`
        CREATE TABLE IF NOT EXISTS bet_rounds (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          bet_color TEXT NOT NULL,
          bet_amount REAL NOT NULL,
          result TEXT NOT NULL,
          profit REAL DEFAULT 0.0,
          strategy TEXT DEFAULT 'manual',
          site TEXT DEFAULT 'blaze.bet.br',
          game TEXT DEFAULT 'mega_fire_blaze',
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Automation configs table
      db.run(`
        CREATE TABLE IF NOT EXISTS automation_configs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          site TEXT DEFAULT 'blaze.bet.br',
          game TEXT DEFAULT 'mega_fire_blaze',
          strategy TEXT DEFAULT 'martingale',
          initial_bet REAL DEFAULT 1.0,
          max_steps INTEGER DEFAULT 10,
          target_color TEXT DEFAULT 'red',
          mode TEXT DEFAULT 'simulation',
          credentials TEXT, -- JSON string
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Admin transactions table
      db.run(`
        CREATE TABLE IF NOT EXISTS admin_transactions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          reason TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Roulette history table
      db.run(`
        CREATE TABLE IF NOT EXISTS roulette_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          provider TEXT NOT NULL,
          game_id TEXT NOT NULL,
          game_name TEXT NOT NULL,
          result_number INTEGER NOT NULL,
          result_color TEXT,
          round_id TEXT,
          timestamp DATETIME NOT NULL,
          raw_data TEXT
        )
      `);
      db.run('CREATE INDEX IF NOT EXISTS idx_roulette_history_game_time ON roulette_history (game_id, timestamp DESC)');

      // Create indexes
      db.run('CREATE INDEX IF NOT EXISTS idx_bet_rounds_user_id ON bet_rounds(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_bet_rounds_timestamp ON bet_rounds(timestamp)');
      db.run('CREATE INDEX IF NOT EXISTS idx_automation_configs_user_id ON automation_configs(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_admin_transactions_user_id ON admin_transactions(user_id)');
      
      resolve();
    });
  });
};

module.exports = { createTables };
