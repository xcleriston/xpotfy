const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Configuração do banco de dados
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'roulette.db');

// Verificar se o arquivo do banco de dados existe
if (!fs.existsSync(DB_PATH)) {
  console.error('Erro: O arquivo do banco de dados não existe:', DB_PATH);
  process.exit(1);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados SQLite');
});

// Função para verificar a estrutura da tabela
function checkTableStructure() {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(roulette_history)", [], (err, columns) => {
      if (err) return reject(err);
      resolve(columns);
    });
  });
}

// Função para criar a tabela com a estrutura correta
function createTable() {
  return new Promise((resolve, reject) => {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS roulette_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id TEXT NOT NULL,
        round_id TEXT NOT NULL,
        result_number INTEGER,
        result_color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, round_id)
      )
    `;
    
    db.run(createTableSQL, (err) => {
      if (err) return reject(err);
      console.log('Tabela roulette_history criada/verificada com sucesso');
      resolve();
    });
  });
}

// Função para adicionar colunas ausentes
async function fixTableStructure() {
  try {
    // Verificar a estrutura atual da tabela
    const columns = await checkTableStructure();
    console.log('Estrutura atual da tabela roulette_history:');
    console.table(columns.map(col => ({
      name: col.name,
      type: col.type,
      notnull: col.notnull,
      dflt_value: col.dflt_value,
      pk: col.pk
    })));
    
    // Verificar e adicionar colunas ausentes
    const requiredColumns = [
      { name: 'id', type: 'INTEGER', isPrimaryKey: true },
      { name: 'game_id', type: 'TEXT', notNull: true },
      { name: 'round_id', type: 'TEXT', notNull: true },
      { name: 'result_number', type: 'INTEGER' },
      { name: 'result_color', type: 'TEXT' },
      { name: 'created_at', type: 'DATETIME', defaultValue: 'CURRENT_TIMESTAMP' }
    ];
    
    for (const reqCol of requiredColumns) {
      const columnExists = columns.some(col => col.name === reqCol.name);
      
      if (!columnExists) {
        console.log(`Adicionando coluna ausente: ${reqCol.name}`);
        
        let alterTableSQL = `ALTER TABLE roulette_history ADD COLUMN ${reqCol.name} ${reqCol.type}`;
        
        if (reqCol.notNull) {
          alterTableSQL += ' NOT NULL';
        }
        
        if (reqCol.defaultValue) {
          alterTableSQL += ` DEFAULT ${reqCol.defaultValue}`;
        }
        
        await new Promise((resolve, reject) => {
          db.run(alterTableSQL, (err) => {
            if (err) return reject(err);
            console.log(`Coluna ${reqCol.name} adicionada com sucesso`);
            resolve();
          });
        });
      } else {
        console.log(`Coluna ${reqCol.name} já existe`);
      }
    }
    
    // Verificar se a tabela está vazia
    const rowCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM roulette_history', [], (err, row) => {
        if (err) return reject(err);
        resolve(row.count);
      });
    });
    
    console.log(`\nTabela roulette_history contém ${rowCount} registros`);
    
    if (rowCount === 0) {
      console.log('A tabela está vazia. Execute o script de seed para adicionar dados de exemplo.');
    }
    
  } catch (error) {
    console.error('Erro ao corrigir a estrutura da tabela:', error.message);
  } finally {
    // Fechar a conexão com o banco de dados
    db.close((err) => {
      if (err) {
        console.error('Erro ao fechar a conexão com o banco de dados:', err.message);
        return;
      }
      console.log('Conexão com o banco de dados fechada');
    });
  }
}

// Executar as funções
async function run() {
  try {
    await createTable();
    await fixTableStructure();
  } catch (error) {
    console.error('Erro durante a execução do script:', error.message);
  }
}

run();
