import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
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
    
    if (formData.password !== formData.confirmPassword) {
      return setError('As senhas não coincidem');
    }
    
    setError('');
    setLoading(true);
    
    try {
      const { success, error } = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      if (success) {
        setSuccess(true);
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(error || 'Falha ao criar conta. Tente novamente.');
      }
    } catch (err) {
      setError('Ocorreu um erro. Por favor, tente novamente.');
      console.error('Erro no registro:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-layout">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">Roulette Automation</div>
            <div className="auth-subtitle">Conta criada com sucesso!</div>
          </div>
          <div className="auth-body text-center">
            <div className="mb-6">
              <div className="bg-green-100 p-3 rounded-full inline-flex">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Sua conta foi criada com sucesso! Você será redirecionado para a página de login em instantes...
            </p>
            <Link 
              to="/login" 
              className="btn btn-primary"
              style={{
                padding: '0.625rem 1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.375rem',
                fontWeight: '500'
              }}
            >
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">Roulette Automation</div>
          <div className="auth-subtitle">Crie sua conta</div>
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
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="form-input"
                placeholder="Digite seu email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label htmlFor="password" className="form-label">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="form-input"
                placeholder="Digite uma senha (mínimo 6 caracteres)"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
              <div className="form-text">
                A senha deve ter pelo menos 6 caracteres
              </div>
            </div>
            
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label htmlFor="confirmPassword" className="form-label">
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="form-input"
                placeholder="Confirme sua senha"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block"
              style={{
                marginTop: '1.5rem',
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
                  Criando conta...
                </>
              ) : 'Criar conta'}
            </button>
            
            <div className="form-footer">
              Já tem uma conta?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: 'var(--primary-color)',
                  fontWeight: '500'
                }}
              >
                Faça login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
