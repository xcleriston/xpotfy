const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configuração do banco de dados
const dbPath = path.resolve(process.env.DATABASE_PATH || './data/roulette.db');
const db = new sqlite3.Database(dbPath);

// Senha de teste
const testPassword = 'admin123';

// Buscar o hash do admin
console.log('=== Verificando hash da senha do admin ===');
db.get('SELECT id, username, password FROM users WHERE username = ?', ['admin'], async (err, user) => {
  if (err) {
    console.error('Erro ao buscar usuário admin:', err.message);
    process.exit(1);
  }

  if (!user) {
    console.error('Usuário admin não encontrado no banco de dados');
    process.exit(1);
  }

  console.log(`Usuário encontrado: ${user.username} (ID: ${user.id})`);
  console.log(`Hash da senha no banco: ${user.password}`);
  
  // Verificar se a senha está correta
  const isMatch = await bcrypt.compare(testPassword, user.password);
  console.log(`\n=== Resultado da verificação de senha ===`);
  console.log(`Senha testada: '${testPassword}'`);
  console.log(`Senha ${isMatch ? 'VÁLIDA' : 'INVÁLIDA'}`);
  
  if (!isMatch) {
    console.log('\n=== Gerando novo hash para a senha ===');
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(testPassword, salt);
    console.log(`Novo hash gerado: ${newHash}`);
    
    console.log('\nExecute o seguinte comando SQL para atualizar a senha:');
    console.log(`UPDATE users SET password = '${newHash}' WHERE username = 'admin';`);
  }
  
  process.exit(0);
});
