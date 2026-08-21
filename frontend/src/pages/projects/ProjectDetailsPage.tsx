import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  Mail,
  Users,
  UserPlus,
  Ticket,
  ShieldCheck,
  Edit3,
  Power,
  Trash2,
  Building2,
  Crown,
  User as UserIcon,
} from 'lucide-react';

import {
  useGetProjectQuery,
  useGetProjectMembersQuery,
  useUpdateProjectMutation,
  useRemoveProjectMemberMutation,
} from '../../features/projects/projectApi';

import { useAuth } from '../../hooks/useAuth';
import type { ProjectMembership, ProjectMemberUser } from '../../features/projects/types';
import { ProjectMembersModal } from '../../features/projects/components/ProjectMembersModal';
import { AddMemberModal } from '../../features/projects/components/AddMembersModal';
import { EditProjectModal } from '../../features/projects/components/EditProjectModal';
import { AccessApprovalQueueModal } from '../../features/projects/components/AccessApprovalQueueModal';

const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { user, isPlatformAdmin } = useAuth();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isAccessQueueOpen, setIsAccessQueueOpen] = useState(false);

  const {
    data: project,
    isLoading: isProjectLoading,
    isError: isProjectError,
  } = useGetProjectQuery(id!, {
    skip: !id,
  });

  const {
    data: membersData,
    isLoading: isMembersLoading,
  } = useGetProjectMembersQuery(id!, {
    skip: !id,
  });

  const [updateProject, { isLoading: isUpdatingStatus }] = useUpdateProjectMutation();
  const [removeMember, { isLoading: isRemovingMember }] = useRemoveProjectMemberMutation();

  const members: ProjectMembership[] = Array.isArray(membersData) ? membersData : [];

  if (isProjectLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 font-sans">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="h-8 w-72 bg-slate-200 rounded animate-pulse mb-3" />
          <div className="h-4 w-full max-w-xl bg-slate-100 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isProjectError || !project) {
    return (
      <div className="max-w-7xl mx-auto font-sans">
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>

        <div className="mt-6 bg-white border border-rose-200 rounded-2xl p-8 text-center shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <FolderKanban className="w-6 h-6" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Project not found
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            The project may not exist or you may not have access to view it.
          </p>

          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="mt-5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition cursor-pointer"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const projectAdmins = members.filter(
    (member: ProjectMembership) => member.role === 'project_admin'
  );

  const internalMembers = members.filter(
    (member: ProjectMembership) =>
      member.role !== 'client_requester' &&
      member.role !== 'client_org_admin'
  );

  const clientMembers = members.filter(
    (member: ProjectMembership) =>
      member.role === 'client_requester' ||
      member.role === 'client_org_admin'
  );

  const isCurrentProjectAdmin = members.some((member: ProjectMembership) => {
    const memberUser =
      typeof member.userId === 'object'
        ? (member.userId as ProjectMemberUser)
        : null;
    return (
      (memberUser?._id === user?.id || memberUser?._id === user?._id) &&
      member.role === 'project_admin'
    );
  });

  const canEditProject = isPlatformAdmin || isCurrentProjectAdmin;
  const canManageMembers = isPlatformAdmin || isCurrentProjectAdmin;

  // Find owner member details if available
  const ownerMembership = members.find((member: ProjectMembership) => {
    const memberUser =
      typeof member.userId === 'object'
        ? (member.userId as ProjectMemberUser)
        : null;
    return (
      (memberUser && memberUser._id === project.ownerId) ||
      member.userId === project.ownerId
    );
  });
  const ownerUser =
    ownerMembership && typeof ownerMembership.userId === 'object'
      ? (ownerMembership.userId as ProjectMemberUser)
      : null;

  const handleToggleStatus = async () => {
    const action = project.isActive ? 'deactivate' : 'activate';
    if (
      confirm(
        `Are you sure you want to ${action} this project? ${
          project.isActive
            ? 'Deactivating will archive the workspace without deleting project data.'
            : 'Activating will re-enable team access.'
        }`
      )
    ) {
      try {
        await updateProject({
          projectId: project._id,
          body: { isActive: !project.isActive },
        }).unwrap();
      } catch (err) {
        alert(`Failed to ${action} project.`);
      }
    }
  };

  const handleRemoveMemberInline = async (membershipId: string, memberName: string) => {
    if (confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      try {
        await removeMember(membershipId).unwrap();
      } catch (err) {
        alert('Failed to remove project member.');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/projects')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </button>

      {/* Project Header Card */}
      <section className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 sm:p-7">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shrink-0 font-bold text-xl shadow-md shadow-indigo-500/20">
                {project.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {project.name}
                  </h1>

                  {project.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-xs font-semibold">
                      <Power className="w-3 h-3 text-slate-400" />
                      Inactive (Archived)
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {project.description || 'No project description provided.'}
                </p>
              </div>
            </div>

            {/* Action Buttons Header */}
            {canEditProject && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAccessQueueOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition cursor-pointer active:scale-[0.98]"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Access Requests Queue</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer active:scale-[0.98]"
                >
                  <Edit3 className="w-4 h-4 text-slate-500" />
                  <span>Edit Details</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={isUpdatingStatus}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-[0.98] ${
                    project.isActive
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{project.isActive ? 'Deactivate' : 'Activate'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Project Metadata Strip */}
        <div className="border-t border-slate-100 px-6 sm:px-7 py-3.5 bg-slate-50/70">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-slate-400">Owner:</span>{' '}
              <strong className="text-slate-800">
                {ownerUser ? ownerUser.name : 'Platform Admin'}
              </strong>
            </span>

            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Created:</span>{' '}
              {new Date(project.createdAt).toLocaleDateString()}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Team Size:</span>{' '}
              <strong className="text-slate-800">{members.length} members</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Members"
          value={members.length}
        />

        <StatCard
          icon={<ShieldCheck className="w-5 h-5" />}
          label="Project Admins"
          value={projectAdmins.length}
        />

        <StatCard
          icon={<Users className="w-5 h-5 text-indigo-500" />}
          label="Internal Team"
          value={internalMembers.length}
        />

        <StatCard
          icon={<Building2 className="w-5 h-5 text-blue-500" />}
          label="Client Members"
          value={clientMembers.length}
        />
      </section>

      {/* Direct Members Section on Page */}
      <section className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Section Bar */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Project Members Roster
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Assigned team members, engineers, and client requesters
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canManageMembers && (
              <>
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer active:scale-[0.98]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add Member</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMembersModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-[0.98]"
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Manage Members</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Member Cards Roster directly on Page */}
        {isMembersLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-16 bg-slate-50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <div>
              <p className="text-sm font-semibold text-slate-700">
                No Members Assigned Yet
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Add team members or client users to start working on tickets in this project.
              </p>
            </div>
            {canManageMembers && (
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add First Member</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((member: ProjectMembership) => {
              const memberUser =
                typeof member.userId === 'object'
                  ? (member.userId as ProjectMemberUser)
                  : null;

              const memberName = memberUser ? memberUser.name : 'Unknown User';
              const memberEmail = memberUser ? memberUser.email : 'No email';

              return (
                <div
                  key={member._id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {memberUser ? memberName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {memberName}
                        </p>
                        {memberUser?._id === project.ownerId && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                            <Crown className="w-3 h-3 text-amber-500" />
                            Owner
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {memberEmail}
                        </span>

                        {member.clientOrganisation && (
                          <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {member.clientOrganisation}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <RoleBadge role={member.role} />

                    {canManageMembers && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMemberInline(member._id, memberName)}
                        disabled={isRemovingMember}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modals */}
      <EditProjectModal
        project={project}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      <AddMemberModal
        projectId={project._id}
        projectName={project.name}
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
      />

      <ProjectMembersModal
        projectId={project._id}
        projectName={project.name}
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
      />

      <AccessApprovalQueueModal
        projectId={project._id}
        projectName={project.name}
        isOpen={isAccessQueueOpen}
        onClose={() => setIsAccessQueueOpen(false)}
      />
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          {icon}
        </div>

        <span className="text-2xl font-bold text-slate-900">
          {value}
        </span>
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-500">
        {label}
      </p>
    </div>
  );
};

interface RoleBadgeProps {
  role: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const roleLabels: Record<string, string> = {
    project_admin: 'Project Admin',
    project_manager: 'Project Manager',
    support_agent: 'Support Agent',
    engineer: 'Engineer',
    client_requester: 'Client Requester',
    client_org_admin: 'Client Org Admin',
  };

  const isClient = role === 'client_requester' || role === 'client_org_admin';
  const isAdmin = role === 'project_admin';

  return (
    <span
      className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap inline-flex items-center gap-1 ${
        isAdmin
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
          : isClient
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      <ShieldCheck className="w-3 h-3" />
      {roleLabels[role] || role}
    </span>
  );
};

export default ProjectDetailsPage;