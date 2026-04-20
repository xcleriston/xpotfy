import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startDevServer() {
  const server = await createServer({
    configFile: false,
    root: __dirname,
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
      extensions: ['.js', '.jsx', '.json'],
    },
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
  });

  await server.listen();
  server.printUrls();
}

startDevServer().catch((err) => {
  console.error('Error starting dev server:', err);
  process.exit(1);
});
