import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleReturn = () => {
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
    } else if (user.userType === 'internal') {
      navigate('/internal/dashboard', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-4 font-sans">
      <div className="max-w-md w-full text-center bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl shadow-slate-200/50">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mb-4 shadow-sm">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          403 - Access Denied
        </h1>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          You do not have permission to access this page. Please return to your designated dashboard or sign in with an authorized account.
        </p>
        <button
          onClick={handleReturn}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 text-sm active:scale-[0.99]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
