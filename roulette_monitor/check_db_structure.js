const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'roulette.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    return;
  }
  console.log('Conectado ao banco de dados SQLite');
  
  // Verificar a estrutura da tabela roulette_history
  db.all("PRAGMA table_info(roulette_history)", [], (err, columns) => {
    if (err) {
      console.error('Erro ao obter informações da tabela roulette_history:', err.message);
    } else {
      console.log('\nEstrutura da tabela roulette_history:');
      // Exibindo em formato de tabela simples
      console.log('| Nome da Coluna | Tipo | Não Nulo | Valor Padrão | Chave Primária |');
      console.log('|----------------|------|----------|--------------|----------------|');
      columns.forEach(col => {
        const colName = col.name.padEnd(14);
        const colType = (col.type || '').padEnd(4);
        const colNotNull = col.notnull ? 'SIM' : 'NÃO';
        const colDefault = (col.dflt_value || 'NENHUM').toString().padEnd(12);
        const colPk = col.pk ? 'SIM' : 'NÃO';
        console.log(`| ${colName} | ${colType} | ${colNotNull.padEnd(8)} | ${colDefault} | ${colPk.padEnd(14)} |`);
      });
    }
    
    // Verificar se há registros na tabela
    db.get("SELECT COUNT(*) as count FROM roulette_history", [], (err, row) => {
      if (err) {
        console.error('Erro ao contar registros na tabela roulette_history:', err.message);
      } else {
        console.log(`\nTotal de registros na tabela roulette_history: ${row.count}`);
      }
      
      // Fechar a conexão com o banco de dados
      db.close();
    });
  });
});
