const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuração
const API_BASE_URL = 'http://localhost:8001/api';

// Dados de teste
const testUser = {
  username: `testuser_${Date.now()}`,
  password: 'testpassword123',
  email: `test_${Date.now()}@example.com`
};

// Token JWT para autenticação
let authToken = '';
let userId = '';

// Função auxiliar para fazer login
async function login(username, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
}

// Testes
(async () => {
  console.log('=== Iniciando testes da API ===\n');

  // 1. Testar login com credenciais de admin
  try {
    console.log('1. Testando login de administrador...');
    const adminLogin = await login('admin', 'admin123');
    authToken = adminLogin.token;
    userId = adminLogin.user.id;
    console.log('✅ Login de administrador bem-sucedido');
    console.log(`   Token recebido: ${authToken.substring(0, 20)}...`);
    console.log(`   ID do usuário: ${userId}\n`);
  } catch (error) {
    console.error('❌ Falha no login de administrador:', error.response?.data?.error || error.message);
    process.exit(1);
  }

  // 2. Testar registro de novo usuário
  try {
    console.log('2. Testando registro de novo usuário...');
    await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    console.log(`✅ Usuário ${testUser.username} registrado com sucesso\n`);
  } catch (error) {
    console.error('❌ Falha no registro de usuário:', error.response?.data?.error || error.message);
    process.exit(1);
  }

  // 3. Testar login com o novo usuário
  try {
    console.log('3. Testando login com o novo usuário...');
    const userLogin = await login(testUser.username, testUser.password);
    console.log(`✅ Login de ${testUser.username} bem-sucedido`);
    console.log(`   Token recebido: ${userLogin.token.substring(0, 20)}...\n`);
  } catch (error) {
    console.error('❌ Falha no login do novo usuário:', error.response?.data?.error || error.message);
    process.exit(1);
  }

  // 4. Testar obtenção do perfil do usuário
  try {
    console.log('4. Testando obtenção do perfil do usuário...');
    const response = await axios.get(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Perfil do usuário obtido com sucesso:');
    console.log(`   ID: ${response.data.id}`);
    console.log(`   Username: ${response.data.username}`);
    console.log(`   Role: ${response.data.role}\n`);
  } catch (error) {
    console.error('❌ Falha ao obter perfil do usuário:', error.response?.data?.error || error.message);
    process.exit(1);
  }

  // 5. Testar colocação de aposta
  try {
    console.log('5. Testando colocação de aposta...');
    const betData = {
      bet_color: 'red',
      bet_amount: 10
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/bets`,
      betData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Aposta realizada com sucesso:');
    console.log(`   Cor apostada: ${response.data.bet_color}`);
    console.log(`   Valor da aposta: ${response.data.bet_amount}`);
    console.log(`   Resultado: ${response.data.result}`);
    console.log(`   Lucro: ${response.data.profit}\n`);
  } catch (error) {
    console.error('❌ Falha ao realizar aposta:', error.response?.data?.error || error.message);
    process.exit(1);
  }

  console.log('=== Todos os testes foram concluídos com sucesso! ===');
})();
