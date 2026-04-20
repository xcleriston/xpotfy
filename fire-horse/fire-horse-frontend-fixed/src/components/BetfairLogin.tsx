import React, { useState } from 'react';
import { useBetfair } from '../contexts/BetfairContext';

const BetfairLogin: React.FC = () => {
  const { login, loading, error } = useBetfair();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [appKey, setAppKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password, appKey);
    } catch (err) {
      // Error is already handled in the context
      console.error('Login error:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Betfair Login</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        
        <div>
          <label htmlFor="appKey" className="block text-sm font-medium text-gray-700">
            Application Key
          </label>
          <input
            id="appKey"
            type="text"
            value={appKey}
            onChange={(e) => setAppKey(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Your Betfair Application Key"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            You need a Betfair API application key to use this app.
          </p>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Signing in...' : 'Sign in to Betfair'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">
          Don't have a Betfair account?{' '}
          <a 
            href="https://www.betfair.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign up here
          </a>
        </p>
        <p className="mt-2 text-xs text-gray-500">
          By signing in, you agree to Betfair's terms and conditions.
        </p>
      </div>
    </div>
  );
};

export default BetfairLogin;
