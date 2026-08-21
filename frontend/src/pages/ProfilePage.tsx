import React, { useState } from 'react';
import {
  User,
  Shield,
  FolderKanban,
  Bell,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Save,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useGetMyProjectsQuery } from '../features/projects/projectApi';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { data: projectsData, isLoading: isLoadingProjects } = useGetMyProjectsQuery();
  const memberships = projectsData || [];

  // BR-NTF-013: Notification channel preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [slaEscalations, setSlaEscalations] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/20 text-white flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              User Profile & Workspace Preferences
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your personal credentials, multi-project access roster, and notification channels.
            </p>
          </div>
        </div>
      </div>

      {/* User Details & Identity Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Identity & Account Status
          </h2>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Full Name</span>
              <span className="font-bold text-slate-900 text-sm">{user?.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Email Address</span>
              <span className="font-medium text-slate-700">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">User Type</span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[11px] uppercase tracking-wider inline-block">
                {user?.userType || 'Client User'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 md:border-l md:border-slate-100 md:pl-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Security & Verification (BR-ACC-002)
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2">
              {user?.isEmailVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Email Verified & Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Email Verification Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Verified accounts can create tickets, receive real-time status updates, and participate in project workspaces.
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Project Access Roster (BR-ACC-006) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Multi-Project Access Roster (BR-ACC-006)
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
            {memberships.length} Active Workspace(s)
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                <th className="p-3">Project Workspace</th>
                <th className="p-3">Role Designation</th>
                <th className="p-3">Client Organisation</th>
                <th className="p-3">Membership Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {isLoadingProjects ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">
                    Loading project roster...
                  </td>
                </tr>
              ) : memberships.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">
                    No active project memberships assigned yet.
                  </td>
                </tr>
              ) : (
                memberships.map((m) => {
                  const p = typeof m.projectId === 'object' ? m.projectId : null;
                  return (
                    <tr key={m._id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-bold text-slate-900">
                        {p?.name || 'Project Workspace'}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                          {m.role}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {m.clientOrganisation || 'N/A'}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notification Channel Preferences (BR-NTF-013) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Notification Channel Preferences (BR-NTF-013)
          </h2>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Preferences saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSavePreferences} className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Email Alerts</span>
                <span className="text-slate-500 text-[11px]">
                  Receive email updates for new comments, status changes, and SLA alerts.
                </span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
              <div>
                <span className="font-bold text-slate-900 block">In-App Banner Notifications</span>
                <span className="text-slate-500 text-[11px]">
                  Display real-time notification toasts in your dashboard topbar.
                </span>
              </div>
              <input
                type="checkbox"
                checked={inAppAlerts}
                onChange={(e) => setInAppAlerts(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
              <div>
                <span className="font-bold text-slate-900 block">SLA Escalation Notifications</span>
                <span className="text-slate-500 text-[11px]">
                  Get alerted immediately when tickets approach or breach SLA deadlines.
                </span>
              </div>
              <input
                type="checkbox"
                checked={slaEscalations}
                onChange={(e) => setSlaEscalations(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-[0.99]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
