import React from 'react';
import { Menu, LogOut, Ticket, ShieldCheck, UserCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLogoutMutation } from '../../features/auth/authApi';
import NotificationBell from '../../features/notifications/components/NotificationBell';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, isInternal, isPlatformAdmin } = useAuth();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const getRoleBadge = () => {
    if (isPlatformAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldAlert className="w-3 h-3" />
          <span>Admin</span>
        </span>
      );
    }
    if (isInternal) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <ShieldCheck className="w-3 h-3" />
          <span>Internal Staff</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <UserCheck className="w-3 h-3" />
        <span>Client</span>
      </span>
    );
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 font-sans shadow-xs">
      {/* Left: Mobile Menu Trigger + Brand Badge */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition md:hidden focus:outline-none"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/20 flex items-center justify-center text-white">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 tracking-tight block leading-tight">
              Support Desk
            </span>
            <span className="text-[11px] text-slate-400 font-medium block leading-tight">
              Ticketing Platform
            </span>
          </div>
        </div>
      </div>

      {/* Right: User Avatar / Badge / Notifications / Sign Out */}
      <div className="flex items-center gap-3 sm:gap-4">
        <NotificationBell />

        {getRoleBadge()}

        {user && (
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {user.name}
            </span>
            <span className="text-[11px] text-slate-400 font-normal leading-tight">
              {user.email}
            </span>
          </div>
        )}

        <div className="w-px h-6 bg-slate-200 hidden sm:block" />

        <button
          type="button"
          onClick={() => logout(undefined)}
          disabled={isLoggingOut}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200 text-xs font-medium flex items-center gap-1.5 focus:outline-none active:scale-[0.98]"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{isLoggingOut ? 'Logging out...' : 'Sign Out'}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
