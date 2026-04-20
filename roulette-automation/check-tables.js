import db from './db.js';

async function checkTables() {
  try {
    // Verifica as tabelas existentes
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    
    console.log('Tables in database:');
    console.table(tables);
    
    // Verifica os usuários
    try {
      const users = await db.all('SELECT * FROM users');
      console.log('\nUsers:');
      console.table(users);
    } catch (err) {
      console.log('\nError querying users table:', err.message);
    }
    
    // Verifica os créditos
    try {
      const credits = await db.all('SELECT * FROM credits');
      console.log('\nCredits:');
      console.table(credits);
    } catch (err) {
      console.log('\nError querying credits table:', err.message);
    }
    
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    // Fecha a conexão com o banco de dados
    if (db) await db.close();
  }
}

checkTables();
