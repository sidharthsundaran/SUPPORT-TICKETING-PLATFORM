import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'internal' | 'client';
  requireAdmin?: boolean;
  loginPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredUserType,
  requireAdmin = false,
  loginPath,
}) => {
  const { isAuthenticated, isInitialized, user } = useAuth();

  if (!isInitialized) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={loginPath ?? '/login'} replace />;
  }

  if (requiredUserType && user.userType !== requiredUserType && !user.isPlatformAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireAdmin && !user.isPlatformAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

