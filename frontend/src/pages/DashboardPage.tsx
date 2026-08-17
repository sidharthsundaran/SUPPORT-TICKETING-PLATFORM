import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLogoutMutation } from '../features/auth/authApi';
import { LogOut, UserCheck, ShieldCheck, Ticket } from 'lucide-react';

interface DashboardPageProps {
  portalTitle?: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  portalTitle = 'Support Workspace',
}) => {
  const { user, isInternal, isPlatformAdmin } = useAuth();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/20 flex items-center justify-center text-white">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">{portalTitle}</h2>
            <p className="text-xs text-slate-500">Authenticated Session Active</p>
          </div>
        </div>

        <div className="space-y-3 bg-slate-50/80 border border-slate-200 rounded-xl p-4 text-xs mb-6">
          <div className="flex justify-between border-b border-slate-200/80 pb-2">
            <span className="text-slate-500">Name</span>
            <span className="font-semibold text-slate-900">{user.name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/80 pb-2">
            <span className="text-slate-500">Email</span>
            <span className="font-semibold text-slate-900">{user.email}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/80 pb-2">
            <span className="text-slate-500">Role</span>
            <span className="inline-flex items-center gap-1 font-semibold text-indigo-600">
              {isInternal ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              {isInternal ? 'Internal Staff' : 'Client User'}
            </span>
          </div>
          {isPlatformAdmin && (
            <div className="flex justify-between">
              <span className="text-slate-500">Admin</span>
              <span className="font-semibold text-emerald-600">Platform Admin</span>
            </div>
          )}
        </div>

        <button
          onClick={() => logout(undefined)}
          disabled={isLoggingOut}
          className="w-full py-2.5 px-4 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl transition flex items-center justify-center gap-2 text-xs disabled:opacity-50 active:scale-[0.99]"
        >
          <LogOut className="w-4 h-4" />
          <span>{isLoggingOut ? 'Logging out...' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
