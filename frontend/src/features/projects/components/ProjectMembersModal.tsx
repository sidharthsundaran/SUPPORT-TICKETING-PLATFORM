import React, { useState } from 'react';
import { X, Users, Shield, Trash2, Building2, User, UserPlus } from 'lucide-react';
import { useGetProjectMembersQuery, useRemoveProjectMemberMutation } from '../projectApi';
import { ProjectMembership, ProjectMemberUser, ProjectRole } from '../types';
import { useAuth } from '../../../hooks/useAuth';
import { AddMemberModal } from './AddMembersModal';

interface ProjectMembersModalProps {
  projectId: string | null;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  projectId,
  projectName,
  isOpen,
  onClose,
}) => {
  const { isPlatformAdmin } = useAuth();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const { data, isLoading } = useGetProjectMembersQuery(projectId ?? '', {
    skip: !projectId || !isOpen,
  });

  const [removeMember, { isLoading: isRemoving }] = useRemoveProjectMemberMutation();

  if (!isOpen || !projectId) return null;

  const members: ProjectMembership[] = Array.isArray(data) ? data : [];

  const formatRole = (role: ProjectRole) => {
    switch (role) {
      case 'project_admin':
        return 'Project Admin';
      case 'support_agent':
        return 'Support Agent';
      case 'engineer':
        return 'Engineer';
      case 'project_manager':
        return 'Project Manager';
      case 'client_requester':
        return 'Client Requester';
      case 'client_org_admin':
        return 'Client Org Admin';
      default:
        return role;
    }
  };

  const handleRemove = async (membershipId: string) => {
    if (confirm('Are you sure you want to remove this member from the project?')) {
      try {
        await removeMember(membershipId).unwrap();
      } catch (err) {
        alert('Failed to remove project member.');
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fadeIn"
          onClick={onClose}
        />

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-lg w-full relative z-10 animate-scaleUp max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">{projectName} Members</h2>
                <p className="text-xs text-slate-500">Project team members and client requesters</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isPlatformAdmin && (
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition focus:outline-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Member List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading project members...</div>
            ) : members.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No members found in this project.</div>
            ) : (
              members.map((membership) => {
                const memberUser =
                  typeof membership.userId === 'object'
                    ? (membership.userId as ProjectMemberUser)
                    : null;

                return (
                  <div
                    key={membership._id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {memberUser ? memberUser.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">
                          {memberUser ? memberUser.name : 'Unknown User'}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          {memberUser?.email}
                        </p>
                        {membership.clientOrganisation && (
                          <div className="inline-flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{membership.clientOrganisation}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                        <Shield className="w-3 h-3 text-indigo-600" />
                        {formatRole(membership.role)}
                      </span>

                      {isPlatformAdmin && (
                        <button
                          type="button"
                          onClick={() => handleRemove(membership._id)}
                          disabled={isRemoving}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 mt-4 shrink-0 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {projectId && (
        <AddMemberModal
          projectId={projectId}
          projectName={projectName}
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
        />
      )}
    </>
  );
};

export default ProjectMembersModal;
