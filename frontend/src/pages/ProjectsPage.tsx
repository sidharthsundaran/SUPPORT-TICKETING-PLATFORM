import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import {
  useGetMyProjectsQuery,
} from '../features/projects/projectApi'

import ProjectCard from '@/features/projects/components/ProjectCard';
import CreateProjectModal from '@/features/projects/components/CreateProjectModal';
import { useAuth } from '@/hooks/useAuth';

export const ProjectsPage: React.FC = () => {
  const { isPlatformAdmin } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  const {
    data: memberships = [],
    isLoading,
    isError,
    refetch,
  } = useGetMyProjectsQuery();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-600" />

            <h1 className="text-xl font-bold text-slate-900">
              Projects
            </h1>
          </div>

          <p className="text-sm text-slate-500 mt-1">
            Manage and access your support projects.
          </p>
        </div>

        {isPlatformAdmin && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />

          <p className="text-sm text-slate-500 mt-3">
            Loading projects...
          </p>
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>

          <h2 className="text-sm font-bold text-slate-900 mt-4">
            Unable to load projects
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Something went wrong while fetching your projects.
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && memberships.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-16 px-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FolderKanban className="w-7 h-7" />
          </div>

          <h2 className="text-base font-bold text-slate-900 mt-5">
            No projects yet
          </h2>

          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            You don't currently have access to any projects.
          </p>

          {isPlatformAdmin && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          )}
        </div>
      )}

      {/* Projects */}
      {!isLoading && !isError && memberships.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {memberships.map((membership) => (
            <ProjectCard
              key={membership._id}
              membership={membership}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default ProjectsPage;