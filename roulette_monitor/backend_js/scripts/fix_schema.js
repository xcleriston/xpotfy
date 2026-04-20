const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Configuração do banco de dados
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'roulette.db');
const db = new sqlite3.Database(DB_PATH);

// Função para verificar a estrutura da tabela
function checkTableStructure() {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(roulette_history)", [], (err, columns) => {
      if (err) {
        console.error('Erro ao verificar a estrutura da tabela:', err.message);
        return reject(err);
      }
      
      console.log('Estrutura atual da tabela roulette_history:');
      console.table(columns.map(col => ({
        name: col.name,
        type: col.type,
        notnull: col.notnull,
        dflt_value: col.dflt_value,
        pk: col.pk
      })));
      
      resolve(columns);
    });
  });
}

// Função para recriar a tabela com o esquema correto
function recreateTable() {
  return new Promise((resolve, reject) => {
    // Iniciar transação
    db.serialize(() => {
      // Desativar chaves estrangeiras temporariamente
      db.run('PRAGMA foreign_keys=OFF');
      
      // Verificar se a tabela existe antes de tentar fazer backup
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='roulette_history'", [], (err, row) => {
        if (err) return reject(err);
        
        const tableExists = !!row;
        
        // Se a tabela existe, verificar se já tem a coluna game_id
        if (tableExists) {
          console.log('Verificando se a tabela já possui a coluna game_id...');
          
          db.all("PRAGMA table_info(roulette_history)", [], (err, columns) => {
            if (err) return reject(err);
            
            const hasGameId = columns.some(col => col.name === 'game_id');
            
            if (hasGameId) {
              console.log('A tabela já possui a coluna game_id. Nenhuma alteração necessária.');
              db.run('PRAGMA foreign_keys=ON');
              return resolve();
            }
            
            console.log('A tabela existe mas não tem a coluna game_id. Atualizando esquema...');
            
            // Fazer backup da tabela existente
            console.log('Criando backup da tabela existente...');
            
            db.serialize(() => {
              // Criar tabela temporária para backup
              db.run('DROP TABLE IF EXISTS temp_roulette_history');
              db.run('CREATE TABLE temp_roulette_history AS SELECT * FROM roulette_history');
              
              console.log('Backup concluído. Atualizando esquema...');
              
              // Remover tabela antiga
              db.run('DROP TABLE roulette_history', (err) => {
                if (err) return reject(err);
                
                // Criar nova tabela com esquema atualizado
                createNewTable(resolve, reject);
              });
            });
          });
        } else {
          // Se a tabela não existe, apenas criar nova
          console.log('Tabela roulette_history não encontrada. Criando nova...');
          createNewTable(resolve, reject);
        }
      });
    });
  });
}

// Função para criar a nova tabela
function createNewTable(resolve, reject) {
  console.log('Criando nova tabela roulette_history com esquema correto...');
  
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
    if (err) {
      console.error('Erro ao criar nova tabela:', err.message);
      return reject(err);
    }
    
    console.log('Nova tabela roulette_history criada com sucesso!');
    
    // Verificar se a tabela temporária existe e tem dados para restaurar
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='temp_roulette_history'", [], (err, tempTable) => {
      if (err) {
        console.error('Erro ao verificar tabela temporária:', err.message);
        return reject(err);
      }
      
      if (tempTable) {
        db.get("SELECT COUNT(*) as count FROM temp_roulette_history", [], (err, row) => {
          if (err) {
            console.error('Erro ao verificar dados temporários:', err.message);
            return reject(err);
          }
          
          if (row && row.count > 0) {
            console.log(`Restaurando ${row.count} registros...`);
            
            // Inserir dados na nova tabela
            db.run(`
              INSERT OR IGNORE INTO roulette_history (game_id, round_id, result_number, result_color, created_at)
              SELECT 
                COALESCE(game_id, 'default') as game_id,
                round_id,
                result_number,
                result_color,
                COALESCE(created_at, CURRENT_TIMESTAMP) as created_at
              FROM temp_roulette_history
            `, (err) => {
              if (err) {
                console.error('Erro ao restaurar dados:', err.message);
                return reject(err);
              }
              
              console.log('Dados restaurados com sucesso!');
              cleanupAndResolve(resolve);
            });
          } else {
            console.log('Nenhum dado para restaurar.');
            cleanupAndResolve(resolve);
          }
        });
      } else {
        console.log('Nenhuma tabela temporária encontrada para restaurar.');
        cleanupAndResolve(resolve);
      }
    });
  });
}

// Função para limpar e finalizar
function cleanupAndResolve(resolve) {
  // Remover tabela temporária se existir
  db.run('DROP TABLE IF EXISTS temp_roulette_history', (err) => {
    if (err) {
      console.error('Aviso: Erro ao remover tabela temporária:', err.message);
    } else {
      console.log('Tabela temporária removida.');
    }
    
    // Reativar chaves estrangeiras
    db.run('PRAGMA foreign_keys=ON');
    
    // Verificar a estrutura final
    checkTableStructure()
      .then(() => {
        console.log('Operação concluída com sucesso!');
        db.close();
        resolve();
      })
      .catch((err) => {
        console.error('Erro ao verificar estrutura final:', err);
        db.close();
        resolve(); // Resolvemos mesmo em caso de erro para não travar o processo
      });
  });
}

// Executar o script
async function main() {
  try {
    console.log('Verificando estrutura da tabela roulette_history...');
    
    // Verificar estrutura atual
    await checkTableStructure();
    
    // Se estiver rodando em modo não interativo, prossegue automaticamente
    if (process.env.NON_INTERACTIVE === 'true') {
      console.log('Modo não interativo ativado. Atualizando esquema automaticamente...');
      await recreateTable();
      console.log('Atualização concluída com sucesso!');
      process.exit(0);
    }
    
    // Modo interativo (padrão)
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Deseja atualizar o esquema da tabela? (s/N) ', async (answer) => {
      if (answer.toLowerCase() === 's') {
        console.log('Iniciando atualização do esquema...');
        try {
          await recreateTable();
          console.log('Atualização concluída com sucesso!');
        } catch (error) {
          console.error('Erro durante a atualização:', error);
        }
      } else {
        console.log('Operação cancelada pelo usuário.');
      }
      
      rl.close();
      db.close();
    });
  } catch (error) {
    console.error('Erro durante a execução do script:', error);
    db.close();
    process.exit(1);
  }
}

main();
