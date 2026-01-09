
import React, { useState } from 'react';
import GlobePage from './pages/GlobePage';
import LoginPage from './pages/LoginPage';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden font-mono selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="absolute inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
      
      {!isAuthenticated ? (
        <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
      ) : (
        <GlobePage />
      )}
    </div>
  );
};

export default App;
