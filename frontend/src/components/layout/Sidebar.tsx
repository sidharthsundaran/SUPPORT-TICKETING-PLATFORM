import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Ticket,
  Tag,
  Users,
  User,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC = () => {
  const { isClient, isInternal, isPlatformAdmin, user } = useAuth();

  const getNavItems = (): NavItem[] => {
    if (isPlatformAdmin) {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Projects', href: '/projects', icon: FolderKanban },
        { name: 'Team Console', href: '/team-console', icon: Ticket },
        { name: 'My Tickets', href: '/my-tickets', icon: Ticket },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Profile', href: '/profile', icon: User },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
      ];
    }

    if (isInternal) {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Projects', href: '/projects', icon: FolderKanban },
        { name: 'Team Console', href: '/team-console', icon: Ticket },
        { name: 'My Tickets', href: '/my-tickets', icon: Ticket },
        { name: 'Profile', href: '/profile', icon: User },
      ];
    }

    // Default Client role
    return [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Projects', href: '/projects', icon: FolderKanban },
      { name: 'My Tickets', href: '/my-tickets', icon: Ticket },
      { name: 'Profile', href: '/profile', icon: User },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 shrink-0 flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] p-4 font-sans">
      <div className="space-y-6">
        {/* Section Label */}
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
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/80 shadow-2xs'
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

      {/* Footer User Info Card */}
      {user && (
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl mt-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate capitalize">
                {isPlatformAdmin ? 'Platform Admin' : isInternal ? 'Internal Staff' : 'Client User'}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
