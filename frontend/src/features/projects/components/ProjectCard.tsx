import React from 'react';
import { FolderKanban, Users, ArrowRight, CircleCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ProjectMembership } from '../types';

interface ProjectCardProps {
  membership: ProjectMembership;
}

const formatRole = (role: string) => {
  return role.replace(/_/g, ' ');
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  membership,
}) => {
  const navigate = useNavigate();

  const project =
    typeof membership.projectId === 'string'
      ? null
      : membership.projectId;

  if (!project) {
    return null;
  }

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
      {/* Top */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {project.name}
            </h3>

            <p className="text-xs text-slate-400 mt-0.5">
              Project
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${
            project.isActive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          {project.isActive && (
            <CircleCheck className="w-3 h-3" />
          )}

          {project.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 leading-relaxed mt-4 min-h-[40px]">
        {project.description || 'No project description provided.'}
      </p>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
            Your role
          </p>

          <p className="text-xs font-semibold text-slate-700 capitalize mt-1">
            {formatRole(membership.role)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/projects/${project._id}`)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
        >
          View Project
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;