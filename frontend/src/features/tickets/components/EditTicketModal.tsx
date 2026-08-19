import React, { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Ticket, TicketSeverity, TicketEvidenceFile } from "../types";
import { useUpdateTicketMutation } from "../ticketApi";
import { useGetProjectQuery } from "../../projects/projectApi";
import TicketEvidenceUploader from "./TicketEvidenceUploader";

interface EditTicketModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_ISSUE_TYPES = [
  "Bug / Defect",
  "How-to Question",
  "Data Issue",
  "Access and Permissions",
  "Performance",
  "Enhancement Request",
  "Integration Issue",
  "Other",
];

const DEFAULT_MODULES = [
  "Job Requisition",
  "Candidate Pipeline",
  "Resume-JD Matching",
  "Voice Bot / Screening",
  "Mailbox",
  "Career Page",
  "Offer Letter",
  "Trivia",
  "Analytics Dashboard",
  "WhatsApp / Teams Integration",
  "User and Role Management",
  "Login and Authentication",
  "Other",
];

const ENVIRONMENT_OPTIONS = [
  "Production",
  "Staging",
  "Development",
];

const SEVERITY_OPTIONS: { value: TicketSeverity; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "enhancement", label: "Enhancement" },
];

export const EditTicketModal: React.FC<EditTicketModalProps> = ({
  ticket,
  isOpen,
  onClose,
}) => {
  const projectId = typeof ticket.projectId === "object" ? ticket.projectId._id : ticket.projectId;
  const { data: project } = useGetProjectQuery(projectId, { skip: !projectId || !isOpen });

  const [updateTicket, { isLoading }] = useUpdateTicketMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [title, setTitle] = useState(ticket.title || "");
  const [description, setDescription] = useState(ticket.description || "");
  const [issueType, setIssueType] = useState(ticket.issueType || "");
  const [module, setModule] = useState(ticket.module || "");
  const [severity, setSeverity] = useState<TicketSeverity>(ticket.severity || "medium");
  const [environment, setEnvironment] = useState(ticket.environment || "Production");
  const [applicationUrl, setApplicationUrl] = useState(ticket.applicationUrl || "");
  const [pageUrl, setPageUrl] = useState(ticket.pageUrl || "");

  const [existingEvidenceFiles, setExistingEvidenceFiles] = useState<TicketEvidenceFile[]>(
    ticket.evidenceFiles || []
  );
  const [newEvidenceFiles, setNewEvidenceFiles] = useState<TicketEvidenceFile[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTitle(ticket.title || "");
      setDescription(ticket.description || "");
      setIssueType(ticket.issueType || "");
      setModule(ticket.module || "");
      setSeverity(ticket.severity || "medium");
      setEnvironment(ticket.environment || "Production");
      setApplicationUrl(ticket.applicationUrl || "");
      setPageUrl(ticket.pageUrl || "");
      setExistingEvidenceFiles(ticket.evidenceFiles || []);
      setNewEvidenceFiles([]);
      setErrorMsg(null);
    }
  }, [ticket, isOpen]);

  const availableIssueTypes: string[] = project?.issueTypes?.length
    ? project.issueTypes.filter((it) => it.isActive).map((it) => it.name)
    : DEFAULT_ISSUE_TYPES;

  const availableModules: string[] = project?.modules?.length
    ? project.modules.filter((m) => m.isActive).map((m) => m.name)
    : DEFAULT_MODULES;

  const issueTypeOptions = issueType && !availableIssueTypes.includes(issueType)
    ? [issueType, ...availableIssueTypes]
    : availableIssueTypes;

  const moduleOptions = module && !availableModules.includes(module)
    ? [module, ...availableModules]
    : availableModules;

  const envOptions = environment && !ENVIRONMENT_OPTIONS.includes(environment)
    ? [environment, ...ENVIRONMENT_OPTIONS]
    : ENVIRONMENT_OPTIONS;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || title.trim().length < 3) {
      setErrorMsg("Title must be at least 3 characters long.");
      return;
    }

    if (!description.trim()) {
      setErrorMsg("Description is required.");
      return;
    }

    try {
      await updateTicket({
        ticketId: ticket._id,
        title: title.trim(),
        description: description.trim(),
        issueType: issueType.trim(),
        module: module.trim(),
        severity,
        environment: environment.trim(),
        applicationUrl: applicationUrl.trim() || undefined,
        pageUrl: pageUrl.trim() || undefined,
        retainedEvidenceKeys: existingEvidenceFiles.map((f) => f.key),
        newEvidenceFiles: newEvidenceFiles,
      }).unwrap();

      onClose();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Failed to update ticket";
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Edit Ticket Details</h3>
            <p className="text-xs text-slate-400">Update ticket #{ticket.ticketNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 transition"
              placeholder="Brief summary of issue"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 transition resize-none"
              placeholder="Detailed description of issue"
            />
          </div>

          {/* Issue Type & Module Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Issue Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 transition cursor-pointer"
              >
                {issueTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Module <span className="text-rose-500">*</span>
              </label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 transition cursor-pointer"
              >
                {moduleOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Severity & Environment Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as TicketSeverity)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 transition cursor-pointer"
              >
                {SEVERITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Environment <span className="text-rose-500">*</span>
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 transition cursor-pointer"
              >
                {envOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Application URL
              </label>
              <input
                type="url"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 transition"
                placeholder="https://app.example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Page URL
              </label>
              <input
                type="url"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 transition"
                placeholder="https://app.example.com/page"
              />
            </div>
          </div>

          {/* Evidence Files Section */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            {existingEvidenceFiles.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Existing Evidence Files
                </label>
                <div className="space-y-1.5">
                  {existingEvidenceFiles.map((file) => (
                    <div
                      key={file.key}
                      className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <span className="font-medium text-slate-700 truncate max-w-[320px]">
                        {file.originalName}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExistingEvidenceFiles((prev) =>
                            prev.filter((f) => f.key !== file.key)
                          )
                        }
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-0.5 rounded hover:bg-rose-50 cursor-pointer transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <TicketEvidenceUploader
              files={newEvidenceFiles}
              onChange={setNewEvidenceFiles}
              maxFiles={5 - existingEvidenceFiles.length}
              disabled={isLoading}
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTicketModal;
