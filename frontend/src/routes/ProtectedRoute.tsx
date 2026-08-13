import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'internal' | 'client';
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredUserType,
  requireAdmin = false,
}) => {
  const { isAuthenticated, isInitialized, user } = useAuth();

  if (!isInitialized) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-4">
        <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full">
          <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-4">You must be logged in to view this page.</p>
        </div>
      </div>
    );
  }

  if (requiredUserType && user.userType !== requiredUserType) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-4">
        <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full">
          <h2 className="text-xl font-bold text-amber-400 mb-2">Unauthorized</h2>
          <p className="text-slate-400 text-sm mb-4">You do not have permission to access this resource.</p>
        </div>
      </div>
    );
  }

  if (requireAdmin && !user.isPlatformAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-4">
        <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full">
          <h2 className="text-xl font-bold text-amber-400 mb-2">Admin Access Required</h2>
          <p className="text-slate-400 text-sm mb-4">Platform Administrator permissions are required.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
