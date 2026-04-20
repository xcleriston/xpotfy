const { createServer } = require('vite');
const path = require('path');

async function start() {
  try {
    console.log('Iniciando servidor Vite...');
    
    const server = await createServer({
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      root: __dirname,
      server: {
        port: 3001,
        open: true,
      },
    });

    await server.listen();
    
    server.printUrls();
    
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

start();
