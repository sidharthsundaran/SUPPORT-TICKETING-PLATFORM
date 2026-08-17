import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PublicRouteProps {
  children: React.ReactNode;
  restrictedForAuth?: boolean;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  restrictedForAuth = false,
}) => {
  const { isAuthenticated, isInitialized, user } = useAuth();

  if (!isInitialized) {
    return null;
  }

  if (isAuthenticated && user && restrictedForAuth) {
    const redirectPath = user.userType === 'internal' ? '/internal/dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;

