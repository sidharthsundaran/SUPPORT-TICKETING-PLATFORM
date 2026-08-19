import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
  Ticket,
  LayoutDashboard,
  FolderKanban,
  Tag,
  Users,
  User,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NavItem } from './Sidebar';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  const { isClient, isInternal, isPlatformAdmin, user } = useAuth();

  if (!isOpen) return null;

  const getNavItems = (): NavItem[] => {
    if (isPlatformAdmin) {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Projects', href: '/projects', icon: FolderKanban },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Tickets', href: '/tickets', icon: Ticket },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
      ];
    }

    if (isInternal) {
      return [
        { name: 'Dashboard', href: '/internal/dashboard', icon: LayoutDashboard },
        { name: 'Projects', href: '/projects', icon: FolderKanban },
        { name: 'Tickets', href: '/tickets', icon: Ticket },
        { name: 'Profile', href: '/profile', icon: User },
      ];
    }

    return [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Projects', href: '/projects', icon: FolderKanban },
      { name: 'My Tickets', href: '/tickets', icon: Ticket },
      { name: 'Profile', href: '/profile', icon: User },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="fixed inset-0 z-50 md:hidden font-sans">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl border-r border-slate-200 flex flex-col justify-between p-4 animate-slideInLeft">
        <div className="space-y-6">
          {/* Header Badge & Close Button */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
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

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition focus:outline-none"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav list */}
          <div>
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Navigation
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isExactDashboard =
                  item.href === '/dashboard' ||
                  item.href === '/internal/dashboard' ||
                  item.href === '/admin/dashboard';

                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={isExactDashboard}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer User Info */}
        {user && (
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl mt-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate capitalize">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default MobileSidebar;
