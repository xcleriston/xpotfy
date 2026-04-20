const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/roulette.db');

// Criar diretório de dados se não existir
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados SQLite');
});

// Criar tabelas
const createTables = () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      credits REAL DEFAULT 0,
      is_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS roulette_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      round_id TEXT NOT NULL,
      result_number INTEGER,
      result_color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(game_id, round_id)
    )`,

    `CREATE TABLE IF NOT EXISTS bet_rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      round_id TEXT NOT NULL,
      result_number INTEGER,
      result_color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(game_id, round_id)
    )`,

    `CREATE TABLE IF NOT EXISTS bets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      round_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      bet_type TEXT NOT NULL,
      bet_value TEXT NOT NULL,
      amount REAL NOT NULL,
      payout REAL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,

    `CREATE TABLE IF NOT EXISTS automation_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_id TEXT NOT NULL,
      strategy_config TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,

    `CREATE TABLE IF NOT EXISTS admin_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`
  ];

  const executeQuery = (query, index) => {
    return new Promise((resolve, reject) => {
      db.run(query, (err) => {
        if (err) {
          console.error(`Erro ao executar query ${index + 1}:`, err.message);
          return reject(err);
        }
        console.log(`Tabela ${index + 1} criada/verificada com sucesso`);
        resolve();
      });
    });
  };

  // Executar queries em sequência
  const runQueries = async () => {
    for (let i = 0; i < queries.length; i++) {
      try {
        await executeQuery(queries[i], i);
      } catch (err) {
        console.error('Erro durante a criação das tabelas:', err);
        process.exit(1);
      }
    }
    
    // Verificar se o usuário admin existe
    db.get("SELECT id FROM users WHERE username = 'admin'", (err, row) => {
      if (err) {
        console.error('Erro ao verificar usuário admin:', err.message);
        process.exit(1);
      }
      
      if (!row) {
        const bcrypt = require('bcrypt');
        const password = 'admin123'; // Senha padrão, deve ser alterada após o primeiro login
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        db.run(
          "INSERT INTO users (username, password, is_admin) VALUES (?, ?, 1)",
          ['admin', hashedPassword],
          function(err) {
            if (err) {
              console.error('Erro ao criar usuário admin:', err.message);
              process.exit(1);
            }
            console.log('Usuário admin criado com sucesso');
            console.log('Usuário: admin');
            console.log('Senha: admin123');
            console.log('Por favor, altere a senha após o primeiro login!');
            process.exit(0);
          }
        );
      } else {
        console.log('Banco de dados inicializado com sucesso!');
        process.exit(0);
      }
    });
  };

  runQueries();
};

// Iniciar o processo
createTables();
