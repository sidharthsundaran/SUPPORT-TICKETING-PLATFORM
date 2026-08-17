import React, { useState } from 'react';
import { Plus, Search, FolderKanban, AlertCircle, RefreshCw } from 'lucide-react';
import { useGetMyProjectsQuery } from '../projectApi';
import { ProjectCard } from './ProjectCard';
import { CreateProjectModal } from './CreateProjectModal';
import { ProjectMembersModal } from './ProjectMembersModal';
import { useAuth } from '../../../hooks/useAuth';
import type { Project, ProjectMembership } from '../types';

export const Projects: React.FC = () => {
  const { isPlatformAdmin } = useAuth();
  const { data, isLoading, isError, refetch } = useGetMyProjectsQuery();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const memberships: ProjectMembership[] = Array.isArray(data) ? data : [];

  const filteredMemberships = memberships.filter((m: ProjectMembership) => {
    const project = typeof m.projectId === 'object' ? (m.projectId as Project) : null;
    if (!project) return false;

    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    return (
      project.name.toLowerCase().includes(term) ||
      (project.description && project.description.toLowerCase().includes(term))
    );
  });

  const handleCloseMembersModal = () => {
    setSelectedProjectForMembers(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <FolderKanban className="w-5 h-5" />
            </div>
            Projects
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your project workspaces and team permissions
          </p>
        </div>

        {isPlatformAdmin && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-indigo-500/20 active:scale-[0.98] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Control Bar: Search Filter */}
      <div className="flex items-center justify-between gap-4 bg-white p-3.5 border border-slate-200/80 rounded-2xl shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          title="Refresh project list"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Content States */}
      {isLoading ? (
        <div className="py-16 text-center bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading your project workspaces...</p>
        </div>
      ) : isError ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-900">Failed to load projects</h3>
            <p className="text-xs text-rose-600 mt-0.5">
              Could not retrieve project memberships. Please verify server connection.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : filteredMemberships.length === 0 ? (
        <div className="py-16 px-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center mx-auto">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">No Projects Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchTerm
                ? `No project matching "${searchTerm}". Try adjusting your search query.`
                : 'You are not currently assigned to any project workspaces.'}
            </p>
          </div>
          {isPlatformAdmin && !searchTerm && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Project</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMemberships.map((membership: ProjectMembership) => (
            <ProjectCard
              key={membership._id}
              membership={membership}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ProjectMembersModal
        projectId={selectedProjectForMembers?.id || null}
        projectName={selectedProjectForMembers?.name || ''}
        isOpen={!!selectedProjectForMembers}
        onClose={handleCloseMembersModal}
      />
    </div>
  );
};

export default Projects;
