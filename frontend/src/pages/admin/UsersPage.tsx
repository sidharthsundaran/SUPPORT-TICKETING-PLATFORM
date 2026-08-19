import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  UserX,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRightLeft,
  Building2,
} from 'lucide-react';
import {
  useGetAdminUsersQuery,
  useUpdateUserStatusMutation,
  useUpdateUserTypeMutation,
  AdminUserItem,
} from '../../features/admin/adminApi';
import { useAuth } from '../../hooks/useAuth';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'internal' | 'client'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { data: users = [], isLoading, isError, refetch } = useGetAdminUsersQuery();
  const [updateStatus, { isLoading: isStatusUpdating }] = useUpdateUserStatusMutation();
  const [updateUserType, { isLoading: isTypeUpdating }] = useUpdateUserTypeMutation();

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || u.userType === typeFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.isActive) ||
      (statusFilter === 'inactive' && !u.isActive);

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleToggleStatus = async (targetUser: AdminUserItem) => {
    setActionError(null);
    setActionSuccess(null);

    if (targetUser._id === currentUser?.id) {
      setActionError('Platform Administrators cannot deactivate their own account.');
      return;
    }

    try {
      const newStatus = !targetUser.isActive;
      const res = await updateStatus({ id: targetUser._id, isActive: newStatus }).unwrap();
      setActionSuccess(res.message || `User account ${newStatus ? 'activated' : 'deactivated'} successfully.`);
    } catch (err: any) {
      setActionError(err?.data?.message || 'Failed to update user status.');
    }
  };

  const handleToggleUserType = async (targetUser: AdminUserItem) => {
    setActionError(null);
    setActionSuccess(null);

    const targetType = targetUser.userType === 'internal' ? 'client' : 'internal';

    if (targetUser.userType === 'client' && targetUser.clientMembershipsCount > 0) {
      setActionError(
        `Cannot convert ${targetUser.name} to internal staff while they hold ${targetUser.clientMembershipsCount} active client project membership(s). Please remove their client project memberships first.`
      );
      return;
    }

    try {
      const res = await updateUserType({ id: targetUser._id, userType: targetType }).unwrap();
      setActionSuccess(res.message || `User account type changed to ${targetType}.`);
    } catch (err: any) {
      setActionError(err?.data?.message || 'Failed to update user account type.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/20 text-white flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Platform User Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global account status control, platform role overview, and conversion guards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Refresh
        </button>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-500 hover:text-rose-800 text-xs font-bold ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-500 hover:text-emerald-800 text-xs font-bold ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer w-full"
            >
              <option value="all">All User Types</option>
              <option value="internal">Internal Staff Only</option>
              <option value="client">Client Users Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer w-full"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading user accounts...</div>
        ) : isError ? (
          <div className="p-8 text-center text-xs text-rose-600 font-semibold">
            Failed to load platform users. Please refresh.
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No users matched your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Global Role</th>
                  <th className="py-3.5 px-4">Account Type</th>
                  <th className="py-3.5 px-4">Client Memberships</th>
                  <th className="py-3.5 px-4">Active Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((u) => {
                  const isSelf = u._id === currentUser?.id;
                  const hasConflictingClientMemberships =
                    u.userType === 'client' && u.clientMembershipsCount > 0;

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition">
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.name}
                              {isSelf && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.2 rounded border border-indigo-100">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Global Role */}
                      <td className="py-3 px-4">
                        {u.isPlatformAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                            Platform Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold">
                            Standard User
                          </span>
                        )}
                      </td>

                      {/* Account Type */}
                      <td className="py-3 px-4">
                        {u.userType === 'internal' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                            Internal Staff
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 text-[11px] font-bold">
                            Client User
                          </span>
                        )}
                      </td>

                      {/* Memberships Count */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {u.clientMembershipsCount > 0 ? (
                          <span className="text-amber-700 font-semibold">
                            {u.clientMembershipsCount} client project(s)
                          </span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>

                      {/* Active Status Switch */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          disabled={isSelf || isStatusUpdating}
                          onClick={() => handleToggleStatus(u)}
                          title={isSelf ? 'Cannot deactivate self' : 'Toggle active status'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer disabled:opacity-50 border ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5 text-rose-600" />
                              Deactivated
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Role Conversion Button */}
                          <button
                            type="button"
                            disabled={hasConflictingClientMemberships || isTypeUpdating}
                            onClick={() => handleToggleUserType(u)}
                            title={
                              hasConflictingClientMemberships
                                ? `Cannot convert: User has ${u.clientMembershipsCount} active client project membership(s)`
                                : `Convert to ${u.userType === 'internal' ? 'Client' : 'Internal'}`
                            }
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                              hasConflictingClientMemberships
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-indigo-600 shadow-xs'
                            }`}
                          >
                            {hasConflictingClientMemberships && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                            <ArrowRightLeft className="w-3 h-3 shrink-0" />
                            <span>
                              {u.userType === 'internal' ? 'Set as Client' : 'Set as Internal'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
