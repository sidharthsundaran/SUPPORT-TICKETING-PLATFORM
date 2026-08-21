import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Ticket as TicketIcon, AlertCircle, Send, FolderKanban, Tag, Layers } from 'lucide-react';
import { z } from 'zod';

import { useGetMyProjectsQuery } from '../../features/projects/projectApi';
import { useCreateTicketMutation } from '../../features/tickets/ticketApi';
import { Project } from '../../features/projects/types';
import { TicketSeverity, TicketEvidenceFile } from '../../features/tickets/types';
import { ApiError } from '../../types/api';
import { useAuth } from '../../hooks/useAuth';
import TicketEvidenceUploader from '../../features/tickets/components/TicketEvidenceUploader';
import { EmailVerificationModal } from '../../features/auth/components/EmailVerificationModal';

const ticketFormSchema = z.object({
  projectId: z.string().min(1, 'Please select a project'),
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters long')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().min(5, 'Please provide a detailed description of the issue'),
  issueType: z.string().trim().min(1, 'Please select an issue type'),
  module: z.string().trim().min(1, 'Please select the affected module'),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'enhancement']),
  environment: z.string().trim().min(1, 'Please specify the environment'),
  applicationUrl: z.string().trim().optional(),
  pageUrl: z.string().trim().optional(),
});

type TicketFormInput = z.infer<typeof ticketFormSchema>;

const DEFAULT_ISSUE_TYPES = [
  'Bug / Defect',
  'How-to Question',
  'Data Issue',
  'Access and Permissions',
  'Performance',
  'Enhancement Request',
  'Integration Issue',
  'Other',
];

const DEFAULT_MODULES = [
  'Job Requisition',
  'Candidate Pipeline',
  'Resume-JD Matching',
  'Voice Bot / Screening',
  'Mailbox',
  'Career Page',
  'Offer Letter',
  'Trivia',
  'Analytics Dashboard',
  'WhatsApp / Teams Integration',
  'User and Role Management',
  'Login and Authentication',
  'Other',
];

export const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projectId, setProjectId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [issueType, setIssueType] = useState<string>('Bug / Defect');
  const [moduleName, setModuleName] = useState<string>('Other');
  const [severity, setSeverity] = useState<TicketSeverity>('medium');
  const [environment, setEnvironment] = useState<string>('Production');
  const [applicationUrl, setApplicationUrl] = useState<string>('');
  const [pageUrl, setPageUrl] = useState<string>('');
  const [evidenceFiles, setEvidenceFiles] = useState<TicketEvidenceFile[]>([]);

  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof TicketFormInput, string>>>({});

  // Fetch projects available to the user
  const { data: projectsData, isLoading: isLoadingProjects } = useGetMyProjectsQuery();
  const memberships = projectsData || [];

  // Selected project object
  const selectedMembership = memberships.find((m) => {
    const p = typeof m.projectId === 'object' ? (m.projectId as Project) : null;
    return p?._id === projectId;
  });

  const selectedProject = typeof selectedMembership?.projectId === 'object'
    ? (selectedMembership.projectId as Project)
    : null;

  // Auto-select first project if available
  useEffect(() => {
    if (!projectId && memberships.length > 0) {
      const firstProj = typeof memberships[0].projectId === 'object'
        ? (memberships[0].projectId as Project)._id
        : (memberships[0].projectId as string);
      if (firstProj) setProjectId(firstProj);
    }
  }, [memberships, projectId]);

  // Project-configured Issue Types & Modules (or BRD defaults)
  const availableIssueTypes: string[] = selectedProject?.issueTypes?.length
    ? selectedProject.issueTypes.filter((it) => it.isActive).map((it) => it.name)
    : DEFAULT_ISSUE_TYPES;

  const availableModules: string[] = selectedProject?.modules?.length
    ? selectedProject.modules.filter((m) => m.isActive).map((m) => m.name)
    : DEFAULT_MODULES;

  // Sync state when project changes
  useEffect(() => {
    if (availableIssueTypes.length > 0) {
      setIssueType(availableIssueTypes[0]);
    }
    if (availableModules.length > 0) {
      setModuleName(availableModules[0]);
    }
  }, [projectId]);

  const [createTicket, { isLoading: isSubmitting }] = useCreateTicketMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const formData: TicketFormInput = {
      projectId,
      title,
      description,
      issueType,
      module: moduleName,
      severity,
      environment,
      applicationUrl: applicationUrl.trim() || undefined,
      pageUrl: pageUrl.trim() || undefined,
    };

    const parseResult = ticketFormSchema.safeParse(formData);

    if (!parseResult.success) {
      const errors: Partial<Record<keyof TicketFormInput, string>> = {};
      let firstMsg = '';
      parseResult.error.issues.forEach((issue, idx) => {
        const path = issue.path[0] as keyof TicketFormInput;
        errors[path] = issue.message;
        if (idx === 0) firstMsg = issue.message;
      });
      setFieldErrors(errors);
      setErrorMessage(firstMsg || 'Please complete all required fields correctly.');
      return;
    }

    try {
      await createTicket({
        ...parseResult.data,
        evidenceFiles,
      }).unwrap();
      navigate('/tickets');
    } catch (err) {
      const errorPayload = err as ApiError;
      setErrorMessage(
        errorPayload?.data?.message || 'Failed to create ticket. Please check your input and try again.'
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/tickets')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tickets
      </button>

      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/20 text-white flex items-center justify-center font-bold">
              <TicketIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Support Ticket</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Submit a detailed issue report to your assigned project support team.</p>
        </div>
      </div>

      {/* BR-ACC-002: Email Verification Warning Banner */}
      {user && !user.isEmailVerified && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold">Email Verification Required (BR-ACC-002)</p>
              <p className="text-[11px] text-amber-700">
                You must verify your email address before raising support tickets.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsVerifyModalOpen(true)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            Verify Email
          </button>
        </div>
      )}

      <EmailVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
      />

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Ticket Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        {/* Project Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
            Project <span className="text-rose-500">*</span>
          </label>

          {isLoadingProjects ? (
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
          ) : memberships.length === 0 ? (
            <p className="text-xs text-rose-600 font-medium p-2.5 bg-rose-50 rounded-xl border border-rose-200">
              You are not assigned to any active projects yet. Please contact your administrator.
            </p>
          ) : (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                fieldErrors.projectId ? 'border-rose-400' : 'border-slate-200'
              } rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer`}
            >
              <option value="">Select a project...</option>
              {memberships.map((m) => {
                const p = typeof m.projectId === 'object' ? (m.projectId as Project) : null;
                if (!p) return null;
                return (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.code ? `(${p.code})` : ''}
                  </option>
                );
              })}
            </select>
          )}
          {fieldErrors.projectId && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.projectId}</p>
          )}
        </div>

        {/* Ticket Title */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Ticket Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Summarize the issue clearly (e.g., Unable to submit candidate form on candidate pipeline)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
              fieldErrors.title ? 'border-rose-400' : 'border-slate-200'
            } rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition`}
          />
          {fieldErrors.title && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.title}</p>
          )}
        </div>

        {/* Issue Categorization Grid (BRD Issue Type & BRD Module) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          {/* Issue Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              Issue Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
            >
              {availableIssueTypes.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Module / Functional Area Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Product Module / Area <span className="text-rose-500">*</span>
            </label>
            <select
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
            >
              {availableModules.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Severity & Environment Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Severity <span className="text-rose-500">*</span>
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as TicketSeverity)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
            >
              <option value="critical">Critical (Blocking)</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="enhancement">Enhancement</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Environment <span className="text-rose-500">*</span>
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
            >
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={5}
            placeholder="Describe what happened, steps to reproduce, expected vs actual behavior..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
              fieldErrors.description ? 'border-rose-400' : 'border-slate-200'
            } rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition resize-none`}
          />
          {fieldErrors.description && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.description}</p>
          )}
        </div>

        {/* Optional Context URLs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Application URL <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="https://app.example.com"
              value={applicationUrl}
              onChange={(e) => setApplicationUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Page / Endpoint URL <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="https://app.example.com/checkout"
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>
        </div>

        {/* Evidence Files Upload Section */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <TicketEvidenceUploader
            files={evidenceFiles}
            onChange={setEvidenceFiles}
            disabled={isSubmitting}
          />
        </div>

        {/* Form Actions */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition text-xs flex items-center gap-2 active:scale-[0.99] cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Ticket</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTicketPage;
