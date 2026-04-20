import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function checkSchema() {
  const db = await open({
    filename: './automation.db',
    driver: sqlite3.Database
  });

  try {
    // Obtém o esquema da tabela users
    const schema = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
    console.log('Schema da tabela users:');
    console.log(schema.sql);
    
    // Lista todas as colunas da tabela users
    const columns = await db.all("PRAGMA table_info(users)");
    console.log('\nColunas da tabela users:');
    console.table(columns);
    
    // Mostra os dados dos usuários
    const users = await db.all('SELECT * FROM users');
    console.log('\nDados dos usuários:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
    });
    
  } catch (err) {
    console.error('Erro ao verificar o esquema:', err);
  } finally {
    await db.close();
  }
}

checkSchema();
