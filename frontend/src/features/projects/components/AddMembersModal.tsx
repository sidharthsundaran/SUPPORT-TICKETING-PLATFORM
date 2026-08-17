import React, { useEffect, useState } from 'react';
import {
  X,
  UserPlus,
  User,
  Shield,
  Building2,
  Bell,
  AlertCircle,
} from 'lucide-react';

import {
  useAddProjectMemberMutation,
  useGetUsersQuery,
} from '../projectApi';

import {
  AddMemberInput,
  addMemberSchema,
} from '../schemas/projectSchema';

import { ProjectRole } from '../types';
import { ApiError } from '../../../types/api';

interface AddMemberModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

const roles: { value: ProjectRole; label: string }[] = [
  {
    value: 'project_admin',
    label: 'Project Admin',
  },
  {
    value: 'project_manager',
    label: 'Project Manager',
  },
  {
    value: 'support_agent',
    label: 'Support Agent',
  },
  {
    value: 'engineer',
    label: 'Engineer',
  },
  {
    value: 'client_requester',
    label: 'Client Requester',
  },
  {
    value: 'client_org_admin',
    label: 'Client Org Admin',
  },
];

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  projectId,
  projectName,
  isOpen,
  onClose,
}) => {
  const [addMember, { isLoading }] = useAddProjectMemberMutation();

  const {
    data: usersData,
    isLoading: isUsersLoading,
  } = useGetUsersQuery();

  const [formData, setFormData] = useState<AddMemberInput>({
    userId: '',
    role: 'support_agent',
    clientOrganisation: '',
    receivesNewTicketAlerts: false,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof AddMemberInput, string>>
  >({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const users = Array.isArray(usersData) ? usersData : [];

  const isClientRole =
    formData.role === 'client_requester' ||
    formData.role === 'client_org_admin';

  useEffect(() => {
    if (!isClientRole) {
      setFormData((previous: AddMemberInput) => ({
        ...previous,
        clientOrganisation: '',
      }));
    }
  }, [isClientRole]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        userId: '',
        role: 'support_agent',
        clientOrganisation: '',
        receivesNewTicketAlerts: false,
      });

      setErrors({});
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (
    field: keyof AddMemberInput,
    value: string | boolean
  ) => {
    setFormData((previous: AddMemberInput) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous: Partial<Record<keyof AddMemberInput, string>>) => ({
      ...previous,
      [field]: undefined,
    }));

    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const result = addMemberSchema.safeParse(formData);

    if (!result.success) {
      const validationErrors: Partial<
        Record<keyof AddMemberInput, string>
      > = {};

      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof AddMemberInput;

        if (!validationErrors[field]) {
          validationErrors[field] = issue.message;
        }
      });

      setErrors(validationErrors);
      return;
    }

    try {
      await addMember({
        projectId,
        body: result.data,
      }).unwrap();

      onClose();
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(
        apiError?.data?.message || 'Failed to add project member. Please try again.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Add Member
              </h2>

              <p className="text-xs text-slate-500">
                Add a member to {projectName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* User */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              User
            </label>

            <select
              value={formData.userId}
              onChange={(event) =>
                handleChange('userId', event.target.value)
              }
              disabled={isUsersLoading || isLoading}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">
                {isUsersLoading
                  ? 'Loading users...'
                  : 'Select a user'}
              </option>

              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} — {user.email} ({user.userType})
                </option>
              ))}
            </select>

            {errors.userId && (
              <p className="mt-1.5 text-[11px] text-rose-600">
                {errors.userId}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              Project Role
            </label>

            <select
              value={formData.role}
              onChange={(event) =>
                handleChange(
                  'role',
                  event.target.value as ProjectRole
                )
              }
              disabled={isLoading}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>

            {errors.role && (
              <p className="mt-1.5 text-[11px] text-rose-600">
                {errors.role}
              </p>
            )}
          </div>

          {/* Client Organisation */}
          {isClientRole && (
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Client Organisation
              </label>

              <input
                type="text"
                value={formData.clientOrganisation ?? ''}
                onChange={(event) =>
                  handleChange(
                    'clientOrganisation',
                    event.target.value
                  )
                }
                placeholder="Enter client organisation"
                disabled={isLoading}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />

              {errors.clientOrganisation && (
                <p className="mt-1.5 text-[11px] text-rose-600">
                  {errors.clientOrganisation}
                </p>
              )}
            </div>
          )}

          {/* Ticket Alerts */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.receivesNewTicketAlerts}
              onChange={(event) =>
                handleChange(
                  'receivesNewTicketAlerts',
                  event.target.checked
                )
              }
              disabled={isLoading}
              className="mt-0.5 w-4 h-4 accent-indigo-600"
            />

            <div>
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-indigo-600" />

                <span className="text-xs font-bold text-slate-700">
                  New ticket alerts
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mt-1">
                Receive notifications when new tickets are created
                for this project.
              </p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading || isUsersLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />

              {isLoading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;