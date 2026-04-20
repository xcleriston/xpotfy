const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Configuração do banco de dados
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'roulette.db');

// Verificar se o arquivo do banco de dados existe
if (!fs.existsSync(DB_PATH)) {
  console.error('Erro: O arquivo do banco de dados não existe:', DB_PATH);
  process.exit(1);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados SQLite');
});

// Dados de exemplo para as roletas
const ROULETTES = [
  { id: 'mega-roulette---brazilian', name: 'Brazilian Mega Roulette' },
  { id: 'roleta-brasileira', name: 'Roleta Brasileira' },
  { id: 'roulette', name: 'European Roulette' },
  { id: 'speed-roulette', name: 'Speed Roulette' },
  { id: 'french-roulette', name: 'French Roulette' },
  { id: 'american-roulette', name: 'American Roulette' },
  { id: 'azure-roulette', name: 'Azure Roulette' },
  { id: 'immersive-roulette-deluxe', name: 'Immersive Roulette' },
  { id: 'roulette-local-br', name: 'Roleta Localizada BR' },
  { id: 'private-roulette', name: 'Private Roulette' }
];

// Função para gerar um número aleatório entre min e max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Função para gerar uma cor aleatória (vermelho ou preto)
function getRandomColor() {
  return Math.random() > 0.5 ? 'red' : 'black';
}

// Função para gerar dados de exemplo para uma roleta
function generateSampleData(rouletteId, count = 100) {
  const results = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const resultNumber = getRandomInt(0, 36);
    const resultColor = resultNumber === 0 ? 'green' : getRandomColor();
    
    results.push({
      game_id: rouletteId,
      round_id: `round-${rouletteId}-${Date.now()}-${i}`,
      result_number: resultNumber,
      result_color: resultColor,
      created_at: new Date(now.getTime() - i * 60000).toISOString()
    });
  }
  
  return results;
}

// Função para verificar a estrutura da tabela roulette_history
function checkTableStructure(callback) {
  db.all("PRAGMA table_info(roulette_history)", [], (err, columns) => {
    if (err) {
      console.error('Erro ao verificar a estrutura da tabela roulette_history:', err.message);
      return callback(err);
    }
    
    console.log('Estrutura da tabela roulette_history:');
    console.table(columns.map(col => ({
      name: col.name,
      type: col.type,
      notnull: col.notnull,
      dflt_value: col.dflt_value,
      pk: col.pk
    })));
    
    callback(null, columns);
  });
}

// Função para inserir dados de exemplo no banco de dados
function seedDatabase() {
  console.log('Iniciando processo de seed...');
  
  // Verificar a estrutura da tabela primeiro
  checkTableStructure((err, columns) => {
    if (err) {
      console.error('Erro ao verificar a estrutura da tabela:', err.message);
      db.close();
      return;
    }
    
    // Verificar se a tabela tem a coluna created_at
    const hasCreatedAt = columns.some(col => col.name === 'created_at');
    
    console.log(`A tabela tem a coluna created_at? ${hasCreatedAt ? 'Sim' : 'Não'}`);
    
    // Limpar a tabela existente
    db.run('DELETE FROM roulette_history', function(err) {
      if (err) {
        console.error('Erro ao limpar a tabela roulette_history:', err.message);
        db.close();
        return;
      }
      
      console.log(`Tabela roulette_history limpa com sucesso. ${this.changes} registros removidos.`);
      
      // Inserir dados de exemplo para cada roleta
      ROULETTES.forEach((roulette, index) => {
        const sampleData = generateSampleData(roulette.id, 30); // Reduzido para 30 registros por roleta para testes
        let insertedCount = 0;
        let errorCount = 0;
        
        console.log(`\nInserindo ${sampleData.length} registros para ${roulette.name}...`);
        
        // Inserir cada resultado no banco de dados
        sampleData.forEach((data, dataIndex) => {
          const stmt = db.prepare(`
            INSERT INTO roulette_history 
            (game_id, round_id, result_number, result_color, created_at)
            VALUES (?, ?, ?, ?, ?)
          `);
          
          stmt.run(
            data.game_id,
            data.round_id,
            data.result_number,
            data.result_color,
            data.created_at,
            function(err) {
              if (err) {
                console.error(`Erro ao inserir registro ${dataIndex + 1} para ${roulette.name}:`, err.message);
                errorCount++;
              } else {
                insertedCount++;
              }
              
              // Verificar se todos os registros foram processados
              if (dataIndex === sampleData.length - 1) {
                console.log(`  ${roulette.name}: ${insertedCount} registros inseridos, ${errorCount} erros`);
                
                // Fechar a conexão com o banco de dados após a última roleta
                if (index === ROULETTES.length - 1) {
                  console.log('\nProcesso de seed concluído.');
                  console.log(`Total: ${insertedCount * ROULETTES.length} registros inseridos com sucesso.`);
                  
                  // Verificar o total de registros na tabela
                  db.get('SELECT COUNT(*) as count FROM roulette_history', [], (err, row) => {
                    if (err) {
                      console.error('Erro ao verificar o total de registros:', err.message);
                    } else {
                      console.log(`Total de registros na tabela: ${row.count}`);
                    }
                    
                    db.close((err) => {
                      if (err) {
                        console.error('Erro ao fechar a conexão com o banco de dados:', err.message);
                        return;
                      }
                      console.log('Conexão com o banco de dados fechada');
                    });
                  });
                }
              }
            }
          );
          
          stmt.finalize();
        });
      });
    });
  });
}

// Iniciar o processo de seed
seedDatabase();
