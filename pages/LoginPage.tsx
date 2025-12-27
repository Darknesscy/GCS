
import React, { useState } from 'react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Hardcoded credentials as per user request
    if (username === '1' && password === '1') {
      setError('');
      onLoginSuccess();
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-black text-cyan-400">
      <div className="w-full max-w-md p-8 space-y-8 bg-black/50 backdrop-blur-md rounded-lg border border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-wider">GLOBAL CONFLICT SPHERE</h1>
          <p className="mt-2 text-sm text-gray-400">Restricted Access</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">User Name</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-cyan-500/50 bg-transparent placeholder-gray-500 text-gray-200 rounded-t-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 sm:text-sm"
                placeholder="User Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-key" className="sr-only">Passport Key</label>
              <input
                id="password-key"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-cyan-500/50 bg-transparent placeholder-gray-500 text-gray-200 rounded-b-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 sm:text-sm"
                placeholder="Passport Key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-cyan-400 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-black transition-all"
            >
              Authenticate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
