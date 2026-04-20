import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
  '.ts': 'application/typescript',
  '.tsx': 'text/tsx',
  '.jsx': 'text/jsx'
};

const server = http.createServer((req, res) => {
  console.log('Requisição recebida:', req.url);
  
  // Servir o arquivo index.html para todas as rotas
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Página não encontrada
        fs.readFile('./404.html', (error, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('Arquivo não encontrado', 'utf-8');
        });
      } else {
        // Erro do servidor
        res.writeHead(500);
        res.end('Desculpe, ocorreu um erro: ' + error.code + '\n');
      }
    } else {
      // Sucesso
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}/`);
  console.log('Pressione Ctrl+C para encerrar o servidor');
});
