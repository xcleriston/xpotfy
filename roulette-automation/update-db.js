import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

async function updateDatabase() {
  let db;
  try {
    db = await open({
      filename: './automation.db',
      driver: sqlite3.Database
    });

    console.log('Database connection successful!');
    
    // Adiciona a coluna email se não existir
    try {
      await db.run('ALTER TABLE users ADD COLUMN email TEXT');
      console.log('Coluna email adicionada à tabela users');
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error('Erro ao adicionar coluna email:', err);
      } else {
        console.log('A coluna email já existe');
      }
    }
    
    // Adiciona a coluna updated_at se não existir
    try {
      // Primeiro adiciona a coluna sem valor padrão
      await db.run('ALTER TABLE users ADD COLUMN updated_at DATETIME');
      // Depois define o valor padrão
      await db.run('UPDATE users SET updated_at = datetime("now")');
      console.log('Coluna updated_at adicionada à tabela users');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('A coluna updated_at já existe');
      } else {
        console.error('Erro ao adicionar coluna updated_at:', err);
      }
    }
    
    // Atualiza o email do admin
    try {
      await db.run("UPDATE users SET email = 'admin@example.com' WHERE username = 'admin'");
      console.log('Email do admin atualizado');
    } catch (err) {
      console.error('Erro ao atualizar email do admin:', err);
    }
    
    // Verifica se o usuário de teste já existe
    const testUser = await db.get("SELECT * FROM users WHERE username = 'testuser'");
    
    if (!testUser) {
      try {
        const hashedPassword = await bcrypt.hash('Test123!', 12);
        const result = await db.run(
          'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
          ['testuser', 'test@example.com', hashedPassword, 'user']
        );
        
        // Adiciona créditos iniciais para o usuário de teste
        await db.run(
          'INSERT INTO credits (user_id, balance) VALUES (?, ?)',
          [result.lastID, 100]
        );
        
        console.log('Usuário de teste criado com sucesso!');
      } catch (err) {
        console.error('Erro ao criar usuário de teste:', err);
      }
    } else {
      console.log('Usuário de teste já existe');
    }
    
    // Verifica a estrutura atualizada da tabela users
    const users = await db.all('SELECT * FROM users');
    console.log('\nUsuários na tabela:');
    console.table(users);
    
  } catch (err) {
    console.error('Erro no banco de dados:', err);
  } finally {
    if (db) await db.close();
  }
}

updateDatabase();
