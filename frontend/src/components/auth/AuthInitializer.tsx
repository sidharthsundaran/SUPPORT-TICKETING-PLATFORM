import React from 'react';
import { useInitAuth } from '../../hooks/useInitAuth';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const { isInitialized } = useInitAuth();

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 font-sans">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 max-w-sm w-full text-center">
          <div className="relative flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-indigo-600 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Authenticating Session</h3>
            <p className="text-xs text-slate-500 mt-1">Restoring your secure environment...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthInitializer;



