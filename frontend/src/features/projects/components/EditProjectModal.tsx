import React, { useEffect, useState } from 'react';
import { X, Edit3, AlertCircle, CheckCircle2, Power } from 'lucide-react';
import { useUpdateProjectMutation } from '../projectApi';
import { updateProjectSchema, UpdateProjectInput } from '../schemas/projectSchema';
import { Project } from '../types';
import { ApiError } from '../../../types/api';

interface EditProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [isActive, setIsActive] = useState(project.isActive);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({});

  const [updateProject, { isLoading }] = useUpdateProjectMutation();

  useEffect(() => {
    if (isOpen) {
      setName(project.name);
      setDescription(project.description || '');
      setIsActive(project.isActive);
      setErrorMessage(null);
      setFieldErrors({});
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const parseResult = updateProjectSchema.safeParse({ name, description, isActive });

    if (!parseResult.success) {
      const errors: { name?: string; description?: string } = {};
      parseResult.error.issues.forEach((issue) => {
        if (issue.path[0] === 'name') errors.name = issue.message;
        if (issue.path[0] === 'description') errors.description = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    try {
      await updateProject({
        projectId: project._id,
        body: parseResult.data as UpdateProjectInput,
      }).unwrap();
      onClose();
    } catch (err) {
      const errorPayload = err as ApiError;
      setErrorMessage(
        errorPayload?.data?.message || 'Failed to update project. Please try again.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-md w-full relative z-10 animate-scaleUp">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Edit Project</h2>
              <p className="text-xs text-slate-500">Update workspace details and status</p>
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
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Mobile App Redesign"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                fieldErrors.name
                  ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'
              } rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition text-sm`}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Briefly describe the scope of this support project..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: undefined }));
              }}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                fieldErrors.description
                  ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'
              } rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition text-sm resize-none`}
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.description}</p>
            )}
          </div>

          {/* Status Toggle (Deactivation Protection) */}
          <div className="pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Power className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Project Status: {isActive ? 'Active' : 'Inactive (Deactivated)'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isActive
                      ? 'Project is visible and active for team members'
                      : 'Deactivated project is archived cleanly without deleting data'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </label>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition text-xs flex items-center gap-2 active:scale-[0.99] cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;
