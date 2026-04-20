// Componente principal
function App() {
  return (
    <div style={{
      fontFamily: '"Roboto", sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#2B6CB0' }}>Bem-vindo ao Fire Horse</h1>
      <p>Esta é uma versão simplificada do frontend em execução no servidor Python.</p>
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        borderLeft: '4px solid #3182ce'
      }}>
        <h3>Próximos passos:</h3>
        <ol style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
          <li>Resolva os problemas com o Vite para obter HMR</li>
          <li>Implemente as rotas da aplicação</li>
          <li>Conecte com a API do backend</li>
        </ol>
      </div>
    </div>
  );
}

// Renderização do aplicativo
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
