import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaLock, FaUser } from 'react-icons/fa';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const result = await login({ username, password });
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Falha no login. Verifique suas credenciais.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar fazer login. Tente novamente.');
      console.error('Erro no login:', err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-xl border border-gray-700">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Acesse sua conta</h2>
          <p className="mt-2 text-sm text-gray-300">Monitor de Roletas em Tempo Real</p>
        </div>
        
        {error && (
          <div className="p-3 text-sm text-red-300 bg-red-900 bg-opacity-30 border-l-4 border-red-500 rounded">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none mt-6">
                  <FaUser className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none mt-6">
                  <FaLock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
            >
              Entrar
            </button>
          </div>
        </form>
        
        <div className="text-sm text-center text-gray-400">
          <p>Dados de acesso: <span className="text-red-400">admin</span> / <span className="text-red-400">admin123</span></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
