import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

async function testDatabase() {
  try {
    // Testar conexão com o banco de dados
    const db = await open({
      filename: './automation.db',
      driver: sqlite3.Database
    });
    
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    
    // Verificar se a tabela users existe e tem dados
    const users = await db.all('SELECT * FROM users');
    console.log('\nUsuários encontrados no banco de dados:');
    console.table(users);
    
    // Testar criptografia de senha
    if (users.length > 0) {
      const user = users[0];
      console.log('\nTestando criptografia de senha para o usuário:', user.username);
      
      // Testar senha correta
      const isMatch = await bcrypt.compare('Admin123!', user.password);
      console.log('Senha "Admin123!" está correta?', isMatch);
      
      // Testar senha incorreta
      const isWrongMatch = await bcrypt.compare('wrongpassword', user.password);
      console.log('Senha "wrongpassword" está correta?', isWrongMatch);
    }
    
    await db.close();
  } catch (error) {
    console.error('Erro ao testar o banco de dados:', error);
  }
}

testDatabase();
