import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Check, AlertCircle, RefreshCw, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

interface PendingMemberItem {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  role: string;
  clientOrganisation?: string;
  status: string;
  createdAt: string;
}

interface AccessApprovalQueueModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AccessApprovalQueueModal: React.FC<AccessApprovalQueueModalProps> = ({
  projectId,
  projectName,
  isOpen,
  onClose,
}) => {
  const { token } = useAuth();
  const [pendingMembers, setPendingMembers] = useState<PendingMemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchPending = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${baseUrl}/projects/${projectId}/pending-memberships`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch pending requests');
      setPendingMembers(data.data || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load pending requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      fetchPending();
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleApprove = async (membershipId: string) => {
    setErrorMessage(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`${baseUrl}/projects/members/${membershipId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Approval failed');

      setActionSuccess('Access request approved successfully!');
      fetchPending();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to approve request');
    }
  };

  const handleReject = async (membershipId: string) => {
    setErrorMessage(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`${baseUrl}/projects/members/${membershipId}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Rejection failed');

      setActionSuccess('Access request rejected.');
      fetchPending();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reject request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-xl w-full relative z-10 animate-scaleUp">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Project Access Approval Queue</h2>
              <p className="text-xs text-slate-500">Review pending access requests for {projectName} (BR-ACC-008)</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition focus:outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-4">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading pending requests...</div>
        ) : pendingMembers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No pending access requests for this project. 🎉
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {pendingMembers.map((m) => {
              const u = typeof m.userId === 'object' ? m.userId : null;
              return (
                <div
                  key={m._id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{u?.name || 'Unknown User'}</p>
                    <p className="text-[11px] text-slate-500">{u?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                        Role: {m.role.replace(/_/g, ' ')}
                      </span>
                      {m.clientOrganisation && (
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">
                          Org: {m.clientOrganisation}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(m._id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(m._id)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
