import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import ProjectDetailsPage from '../pages/projects/ProjectDetailsPage';
import TicketsPage from '../pages/tickets/TicketsPage';
import CreateTicketPage from '../pages/tickets/CreateTicketPage';
import TicketDetailsPage from '../pages/tickets/TicketDetailsPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { useAuth } from '../hooks/useAuth';

import UsersPage from '../pages/admin/UsersPage';

const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.isPlatformAdmin) return <Navigate to="/admin/dashboard" replace />;
  if (user?.userType === 'internal') return <Navigate to="/internal/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const AppRoutes: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute restrictedForAuth>
            <LoginPage onSwitchToRegister={() => navigate('/register')} />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute restrictedForAuth>
            <RegisterPage onSwitchToLogin={() => navigate('/login')} />
          </PublicRoute>
        }
      />

      {/* Protected Dashboard Shell Routes (wrapped in AppLayout) */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Client Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredUserType="client">
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Internal Staff Routes */}
        <Route
          path="/internal/dashboard"
          element={
            <ProtectedRoute requiredUserType="internal">
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Platform Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireAdmin loginPath="/login">
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Shared / Secondary Nav Routes */}
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailsPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/tickets/new" element={<CreateTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailsPage />} />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAdmin>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute requireAdmin>
              <PlaceholderPage title="Platform Settings" description="System configuration and global platform parameters." />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={<PlaceholderPage title="Profile Settings" description="Manage your account preferences and credentials." />}
        />
      </Route>

      {/* Standalone Fallback & Unauthorized Routes */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};

export default AppRoutes;
