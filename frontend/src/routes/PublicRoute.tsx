import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface PublicRouteProps {
  children: React.ReactNode;
  restrictedForAuth?: boolean;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  restrictedForAuth = false,
}) => {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) {
    return null;
  }

  if (isAuthenticated && restrictedForAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-4">
        <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full">
          <h2 className="text-xl font-bold text-indigo-400 mb-2">Already Authenticated</h2>
          <p className="text-slate-400 text-sm mb-4">You are already signed in.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PublicRoute;
