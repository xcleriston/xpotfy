const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'roulette.db');
console.log(`Conectando ao banco de dados em: ${dbPath}`);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados:', err.message);
    return;
  }

  console.log('Conexão com o banco de dados estabelecida com sucesso!');
  
  // Verificar tabelas existentes
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
      console.error('Erro ao listar tabelas:', err.message);
      db.close();
      return;
    }
    
    console.log('\nTabelas no banco de dados:');
    tables.forEach(table => console.log(`- ${table.name}`));
    
    // Verificar estrutura da tabela roulette_history
    db.all('PRAGMA table_info(roulette_history)', [], (err, columns) => {
      if (err) {
        console.error('\nErro ao obter informações da tabela roulette_history:', err.message);
      } else {
        console.log('\nEstrutura da tabela roulette_history:');
        console.table(columns);
      }
      
      // Verificar registros na tabela roulette_history
      db.all('SELECT * FROM roulette_history ORDER BY created_at DESC LIMIT 5', [], (err, rows) => {
        if (err) {
          console.error('\nErro ao consultar registros:', err.message);
        } else {
          console.log(`\nTotal de registros na tabela roulette_history: ${rows.length}`);
          if (rows.length > 0) {
            console.log('\nÚltimos registros (mais recentes primeiro):');
            console.table(rows);
          }
        }
        
        db.close(err => {
          if (err) {
            console.error('Erro ao fechar a conexão com o banco de dados:', err.message);
          } else {
            console.log('\nConexão com o banco de dados encerrada.');
          }
        });
      });
    });
  });
});
