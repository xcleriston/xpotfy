const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco de dados
const dbPath = path.join(__dirname, 'data', 'roulette.db');

// Conectar ao banco de dados
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    return;
  }
  console.log('Conectado ao banco de dados SQLite.');
});

// Executar consulta para verificar tabelas
db.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, tables) => {
  if (err) {
    console.error('Erro ao listar tabelas:', err.message);
    return;
  }
  
  console.log('\nTabelas no banco de dados:');
  console.table(tables.map(t => t.name));
  
  // Verificar se a tabela roulette_history existe
  if (tables.some(t => t.name === 'roulette_history')) {
    // Contar registros na tabela roulette_history
    db.get("SELECT COUNT(*) as count FROM roulette_history;", [], (err, row) => {
      if (err) {
        console.error('Erro ao contar registros:', err.message);
      } else {
        console.log(`\nTotal de registros em roulette_history: ${row.count}`);
        
        // Se houver registros, mostrar alguns exemplos
        if (row.count > 0) {
          db.all("SELECT game_id, COUNT(*) as count FROM roulette_history GROUP BY game_id;", [], (err, rows) => {
            if (err) {
              console.error('Erro ao agrupar por game_id:', err.message);
            } else {
              console.log('\nContagem por game_id:');
              console.table(rows);
              
              // Mostrar alguns registros de exemplo
              db.all("SELECT * FROM roulette_history ORDER BY created_at DESC LIMIT 3;", [], (err, samples) => {
                if (err) {
                  console.error('Erro ao buscar amostras:', err.message);
                } else {
                  console.log('\nÚltimos 3 registros:');
                  console.table(samples);
                }
                
                // Fechar a conexão
                db.close();
              });
            }
          });
        } else {
          console.log('Nenhum registro encontrado na tabela roulette_history.');
          db.close();
        }
      }
    });
  } else {
    console.log('A tabela roulette_history não foi encontrada.');
    db.close();
  }
});
