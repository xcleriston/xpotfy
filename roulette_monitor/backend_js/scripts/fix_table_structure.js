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

console.log('Conectando ao banco de dados...');
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    process.exit(1);
  }
  
  console.log('Conexão com o banco de dados estabelecida.');
  
  // Iniciar a correção da estrutura
  fixTableStructure();
});

// Função para corrigir a estrutura da tabela
function fixTableStructure() {
  console.log('\nIniciando correção da estrutura da tabela roulette_history...');
  
  // Criar uma transação para garantir a integridade dos dados
  db.serialize(() => {
    // 1. Verificar a estrutura atual da tabela
    db.all("PRAGMA table_info(roulette_history)", [], (err, columns) => {
      if (err) {
        console.error('Erro ao verificar a estrutura da tabela:', err.message);
        return finishWithError();
      }
      
      console.log('\nEstrutura atual da tabela roulette_history:');
      console.table(columns.map(col => ({
        name: col.name,
        type: col.type,
        notnull: col.notnull,
        dflt_value: col.dflt_value,
        pk: col.pk
      })));
      
      // 2. Criar uma tabela temporária com a estrutura correta
      console.log('\nCriando tabela temporária com a estrutura correta...');
      
      const createTempTableSQL = `
        CREATE TABLE IF NOT EXISTS roulette_history_temp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          game_id TEXT NOT NULL,
          round_id TEXT NOT NULL,
          result_number INTEGER,
          result_color TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(game_id, round_id)
        )
      `;
      
      db.run(createTempTableSQL, (err) => {
        if (err) {
          console.error('Erro ao criar tabela temporária:', err.message);
          return finishWithError();
        }
        
        console.log('Tabela temporária criada com sucesso.');
        
        // 3. Copiar dados para a tabela temporária (se houver)
        console.log('\nCopiando dados para a tabela temporária...');
        
        db.run('INSERT OR IGNORE INTO roulette_history_temp (game_id, round_id, result_number, result_color, created_at) SELECT game_id, round_id, result_number, result_color, created_at FROM roulette_history', function(err) {
          if (err) {
            console.error('Erro ao copiar dados para a tabela temporária:', err.message);
            return finishWithError();
          }
          
          console.log(`Dados copiados: ${this.changes} registros transferidos.`);
          
          // 4. Renomear tabelas
          console.log('\nRenomeando tabelas...');
          
          db.serialize(() => {
            // Desativar chaves estrangeiras temporariamente
            db.run('PRAGMA foreign_keys=OFF');
            
            // Renomear tabela antiga
            db.run('DROP TABLE IF EXISTS roulette_history_old');
            db.run('ALTER TABLE roulette_history RENAME TO roulette_history_old', (err) => {
              if (err) {
                console.error('Erro ao renomear tabela antiga:', err.message);
                return finishWithError();
              }
              
              // Renomear tabela temporária para o nome correto
              db.run('ALTER TABLE roulette_history_temp RENAME TO roulette_history', (err) => {
                if (err) {
                  console.error('Erro ao renomear tabela temporária:', err.message);
                  return finishWithError();
                }
                
                console.log('Estrutura da tabela corrigida com sucesso!');
                
                // 5. Verificar a nova estrutura
                console.log('\nNova estrutura da tabela roulette_history:');
                db.all('PRAGMA table_info(roulette_history)', [], (err, newColumns) => {
                  if (err) {
                    console.error('Erro ao verificar nova estrutura:', err.message);
                  } else {
                    console.table(newColumns.map(col => ({
                      name: col.name,
                      type: col.type,
                      notnull: col.notnull,
                      dflt_value: col.dflt_value,
                      pk: col.pk
                    })));
                  }
                  
                  // 6. Verificar contagem de registros
                  db.get('SELECT COUNT(*) as count FROM roulette_history', [], (err, row) => {
                    if (err) {
                      console.error('Erro ao verificar contagem de registros:', err.message);
                    } else {
                      console.log(`\nTotal de registros na tabela roulette_history: ${row.count}`);
                    }
                    
                    // Reativar chaves estrangeiras
                    db.run('PRAGMA foreign_keys=ON');
                    
                    // Finalizar com sucesso
                    finishWithSuccess();
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

// Função para finalizar com sucesso
function finishWithSuccess() {
  console.log('\nOperação concluída com sucesso!');
  db.close();
  process.exit(0);
}

// Função para finalizar com erro
function finishWithError() {
  console.log('\nOcorreu um erro durante a operação.');
  db.close();
  process.exit(1);
}
