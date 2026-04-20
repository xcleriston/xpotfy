const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configuração do banco de dados
const dbPath = path.resolve(process.env.DATABASE_PATH || './data/roulette.db');
const db = new sqlite3.Database(dbPath);

// Configuração do admin
const adminConfig = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  role: 'admin'
};

// Função para listar usuários
function listUsers() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, username, role FROM users', [], (err, rows) => {
      if (err) {
        console.error('Erro ao listar usuários:', err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

// Função para criar um usuário admin
async function createAdminUser() {
  return new Promise(async (resolve, reject) => {
    try {
      // Verificar se o admin já existe
      db.get('SELECT * FROM users WHERE username = ?', [adminConfig.username], async (err, row) => {
        if (err) {
          console.error('Erro ao verificar usuário admin:', err.message);
          return reject(err);
        }

        if (row) {
          console.log('Usuário admin já existe:');
          console.log(`ID: ${row.id}, Usuário: ${row.username}, Função: ${row.role}`);
          return resolve(row);
        }

        // Se não existir, criar o admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminConfig.password, salt);
        const userId = require('crypto').randomUUID();
        const now = new Date().toISOString();

        db.run(
          'INSERT INTO users (id, username, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
          [userId, adminConfig.username, hashedPassword, adminConfig.role, now],
          function(err) {
            if (err) {
              console.error('Erro ao criar usuário admin:', err.message);
              return reject(err);
            }
            console.log('Usuário admin criado com sucesso!');
            console.log(`Usuário: ${adminConfig.username}`);
            console.log(`Senha: ${adminConfig.password}`);
            console.log('Por favor, altere esta senha após o primeiro login!');
            resolve({ id: userId, username: adminConfig.username, role: adminConfig.role });
          }
        );
      });
    } catch (error) {
      console.error('Erro ao criar usuário admin:', error);
      reject(error);
    }
  });
}

// Executar as verificações
async function main() {
  try {
    console.log('=== Verificando usuários no banco de dados ===');
    
    // Listar usuários existentes
    const users = await listUsers();
    console.log('\n=== Usuários encontrados ===');
    if (users.length === 0) {
      console.log('Nenhum usuário encontrado no banco de dados.');
    } else {
      users.forEach(user => {
        console.log(`- ID: ${user.id}, Usuário: ${user.username}, Função: ${user.role}`);
      });
    }

    // Verificar/criar admin
    console.log('\n=== Verificando usuário admin ===');
    await createAdminUser();
    
  } catch (error) {
    console.error('Erro durante a verificação:', error);
  } finally {
    // Fechar conexão com o banco de dados
    db.close();
  }
}

// Executar o script
main();
