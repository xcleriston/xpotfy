const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco de dados
const DB_PATH = path.join(__dirname, '../data/roulette.db');

// Conectar ao banco de dados
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    return;
  }
  console.log('Conexão com o banco de dados estabelecida com sucesso!');
  
  // Verificar tabelas existentes
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='roulette_history';", [], (err, tables) => {
    if (err) {
      console.error('Erro ao verificar tabelas:', err.message);
      return;
    }
    
    if (tables.length === 0) {
      console.log('A tabela roulette_history não existe. Criando...');
      
      // Criar a tabela se não existir
      db.run(`
        CREATE TABLE roulette_history (
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
      `, (err) => {
        if (err) {
          console.error('Erro ao criar a tabela roulette_history:', err.message);
          return;
        }
        console.log('Tabela roulette_history criada com sucesso!');
        
        // Criar índices
        db.run('CREATE INDEX IF NOT EXISTS idx_roulette_history_game_time ON roulette_history (game_id, timestamp DESC)', (err) => {
          if (err) {
            console.error('Erro ao criar índice:', err.message);
            return;
          }
          console.log('Índice criado com sucesso!');
        });
      });
    } else {
      console.log('A tabela roulette_history já existe.');
      
      // Verificar a estrutura da tabela
      db.all("PRAGMA table_info(roulette_history);", [], (err, columns) => {
        if (err) {
          console.error('Erro ao verificar a estrutura da tabela:', err.message);
          return;
        }
        
        console.log('\nEstrutura da tabela roulette_history:');
        console.log('-----------------------------------');
        console.log('| Nome da Coluna | Tipo | Permite NULL | Chave Primária |');
        console.log('-----------------------------------');
        
        columns.forEach(col => {
          console.log(`| ${col.name.padEnd(15)} | ${col.type.padEnd(10)} | ${col.notnull === 0 ? 'SIM' : 'NÃO'}         | ${col.pk === 1 ? 'SIM' : 'NÃO'}        |`);
        });
        
        console.log('-----------------------------------');
      });
    }
  });
});

// Fechar a conexão quando terminar
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Erro ao fechar a conexão com o banco de dados:', err.message);
    } else {
      console.log('Conexão com o banco de dados fechada com sucesso!');
    }
    process.exit(0);
  });
});
