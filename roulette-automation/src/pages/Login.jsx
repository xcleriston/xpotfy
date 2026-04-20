import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { success, error } = await login(formData.username, formData.password, rememberMe);
      if (!success) {
        setError(error || 'Falha ao fazer login. Verifique suas credenciais.');
      }
    } catch (err) {
      setError('Ocorreu um erro. Por favor, tente novamente.');
      console.error('Erro no login:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">Roulette Automation</div>
          <div className="auth-subtitle">Faça login para acessar sua conta</div>
        </div>
        
        <div className="auth-body">
          {error && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              <div style={{ 
                padding: '0.75rem 1rem', 
                backgroundColor: '#fef2f2', 
                borderLeft: '4px solid #ef4444',
                borderRadius: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Nome de usuário
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="form-input"
                placeholder="Digite seu nome de usuário"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label htmlFor="password" className="form-label">
                  Senha
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm"
                  style={{ color: 'var(--primary-color)' }}
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="form-input"
                placeholder="Digite sua senha"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div className="form-group" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginTop: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-color focus:ring-primary-color"
                disabled={loading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm" style={{ color: 'var(--text-color)' }}>
                Lembrar de mim
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block"
              style={{
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '0.5rem',
                opacity: loading ? '0.7' : '1',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </>
              ) : 'Entrar'}
            </button>
            
            <div className="form-footer">
              Não tem uma conta?{' '}
              <Link 
                to="/register" 
                style={{ 
                  color: 'var(--primary-color)',
                  fontWeight: '500'
                }}
              >
                Cadastre-se
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
