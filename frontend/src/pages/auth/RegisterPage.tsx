import React from 'react';
import { Ticket } from 'lucide-react';
import { RegisterForm } from '../../features/auth/components/RegisterForm';

interface RegisterPageProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSwitchToLogin,
  onSuccess,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-4 relative overflow-hidden font-sans">
      {/* Subtle Warm Gradient Accent */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-50/60 to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Platform Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/20 mb-3 text-white">
            <Ticket className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create an Account
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Join the Support Ticketing Platform
          </p>
        </div>

        {/* Clean White Card Container */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
          <RegisterForm
            onSwitchToLogin={onSwitchToLogin}
            onSuccess={onSuccess}
          />
        </div>

        <div className="text-center mt-6 text-xs text-slate-400 font-medium">
          Support Ticketing Platform &bull; Secure Authentication System
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;



