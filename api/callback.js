export default function handler(req, res) {
  if (req.method === 'GET') {
    const { code, error } = req.query;
    
    if (error) {
      res.status(400).send(`
        <html>
          <body>
            <h1>Erro na autenticação</h1>
            <p>${error}</p>
          </body>
        </html>
      `);
      return;
    }
    
    if (code) {
      res.status(200).send(`
        <html>
          <body>
            <h1>Autenticação concluída!</h1>
            <p>Código de autorização recebido: ${code.substring(0, 20)}...</p>
            <p>Você pode fechar esta página.</p>
            <script>
              // Enviar o código para a origem via postMessage
              window.opener.postMessage({ code: '${code}' }, '*');
            </script>
          </body>
        </html>
      `);
    } else {
      res.status(400).send(`
        <html>
          <body>
            <h1>Erro</h1>
            <p>Nenhum código de autorização recebido</p>
          </body>
        </html>
      `);
    }
  } else {
    res.status(405).send('Method not allowed');
  }
}
