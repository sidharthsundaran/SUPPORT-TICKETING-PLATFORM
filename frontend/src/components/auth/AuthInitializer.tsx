import React from 'react';
import { useInitAuth } from '../../hooks/useInitAuth';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const { isInitialized } = useInitAuth();

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-md max-w-sm w-full text-center">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <div className="absolute w-6 h-6 rounded-full bg-indigo-500/10 blur-sm" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Authenticating Session</h3>
            <p className="text-xs text-slate-400 mt-1">Restoring your secure environment...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthInitializer;
