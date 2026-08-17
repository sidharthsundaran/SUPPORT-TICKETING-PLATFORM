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
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';

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
              <DashboardPage portalTitle="Client Support Portal" />
            </ProtectedRoute>
          }
        />

        {/* Internal Staff Routes */}
        <Route
          path="/internal/dashboard"
          element={
            <ProtectedRoute requiredUserType="internal">
              <DashboardPage portalTitle="Internal Staff Desk" />
            </ProtectedRoute>
          }
        />

        {/* Platform Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireAdmin loginPath="/login">
              <DashboardPage portalTitle="Platform Admin Console" />
            </ProtectedRoute>
          }
        />

        {/* Shared / Secondary Nav Routes */}
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailsPage />} />
        <Route
          path="/tickets"
          element={<PlaceholderPage title="Tickets" description="View and manage support tickets." />}
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute requiredUserType="internal">
              <PlaceholderPage title="Categories" description="Manage support ticket classification categories." />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAdmin>
              <PlaceholderPage title="User Management" description="Manage platform user accounts and permissions." />
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
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
