import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthInitializer } from './components/auth/AuthInitializer';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <AppRoutes />
      </AuthInitializer>
    </BrowserRouter>
  );
}



