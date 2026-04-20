// Agendador automático para coletar histórico das roletas periodicamente
// Uso: node scripts/blaze_roulette_cron.js <TOKEN>

const cron = require('node-cron');
const { exec } = require('child_process');

const token = process.argv[2];
if (!token) {
  console.error('Uso: node scripts/blaze_roulette_cron.js <TOKEN>');
  process.exit(1);
}

// A cada 2 minutos (pode ajustar para sua necessidade)
cron.schedule('*/2 * * * *', () => {
  console.log(`[${new Date().toISOString()}] Iniciando coleta automática de histórico das roletas...`);
  exec(`node ${__dirname}/blaze_roulette_collector.js ${token}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao executar coleta: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
  });
});

console.log('Agendador de coleta iniciado. Para interromper, pressione Ctrl+C.');
