const axios = require('axios');

async function testBlazeAPI() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTYxMDU4NiwiaXNSZWZyZXNoVG9rZW4iOmZhbHNlLCJibG9ja3MiOltdLCJ1dWlkIjoiMDRlYzA3MjYtNDRmOC00NDkyLTlkYTgtMmVjOTE2MjY1MzAxIiwiaWF0IjoxNzU0NjA5NzQ2LCJleHAiOjE3NTk3OTM3NDZ9.9q3gMSO4sYPyQ5w5ds-X6bR--IaAZxQ8yvEET9n6Hjs';
  const gameId = 'mega-roulette---brazilian';
  const url = `https://blaze.com/api/roulette_games/history?game_id=${gameId}&page=1`;
  
  console.log(`Testando endpoint: ${url}`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // Adiciona logs detalhados da requisição
      httpAgent: new (require('http').Agent)({ keepAlive: true }),
      httpsAgent: new (require('https').Agent)({ keepAlive: true })
    });
    
    console.log('Resposta recebida:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Dados:', response.data);
    
  } catch (error) {
    console.error('Erro na requisição:');
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um status fora do intervalo 2xx
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
      console.log('Dados:', error.response.data);
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Sem resposta do servidor:', error.request);
    } else {
      // Ocorreu um erro ao configurar a requisição
      console.error('Erro:', error.message);
    }
    console.error('Stack:', error.stack);
  }
}

testBlazeAPI();
