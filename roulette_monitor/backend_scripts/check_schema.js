const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'roulette.db');
const db = new sqlite3.Database(DB_PATH);

console.log('Verificando estrutura da tabela roulette_history...');

db.serialize(() => {
  // Verificar se a tabela existe
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='roulette_history'", (err, row) => {
    if (err) {
      console.error('Erro ao verificar tabela:', err);
      return;
    }
    
    if (!row) {
      console.log('A tabela roulette_history não existe.');
      return;
    }
    
    console.log('Tabela roulette_history encontrada. Verificando estrutura...');
    
    // Obter informações da estrutura da tabela
    db.all("PRAGMA table_info(roulette_history)", (err, columns) => {
      if (err) {
        console.error('Erro ao obter estrutura da tabela:', err);
        return;
      }
      
      console.log('\nEstrutura da tabela roulette_history:');
      console.log('--------------------------------');
      console.log('Coluna'.padEnd(15) + '| Tipo'.padEnd(15) + '| Pode ser nulo?'.padEnd(15) + '| Chave primária?'.padEnd(15));
      console.log('-'.repeat(60));
      
      columns.forEach(col => {
        console.log(
          col.name.padEnd(15) + '| ' + 
          (col.type || 'TEXT').padEnd(14) + '| ' + 
          (col.notnull === 0 ? 'SIM' : 'NÃO').padEnd(14) + '| ' + 
          (col.pk === 1 ? 'SIM' : 'NÃO').padEnd(15)
        );
      });
      
      // Verificar índices
      db.all("PRAGMA index_list('roulette_history')", (err, indexes) => {
        if (indexes && indexes.length > 0) {
          console.log('\nÍndices na tabela roulette_history:');
          indexes.forEach(idx => {
            console.log(`- ${idx.name} (${idx.unique ? 'ÚNICO' : 'NÃO ÚNICO'})`);
          });
        } else {
          console.log('\nNenhum índice encontrado na tabela roulette_history.');
        }
        
        db.close();
      });
    });
  });
});
