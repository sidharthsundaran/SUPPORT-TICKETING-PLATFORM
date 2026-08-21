import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  UserRound,
  FolderKanban,
  Layers3,
  Monitor,
  AlertCircle,
  Clock3,
  Globe,
  Link2,
  CheckCircle2,
  Loader2,
  Edit3,
  History,
  Paperclip,
  ExternalLink,
  FileImage,
  FileText,
} from "lucide-react";

import {
  useGetTicketByIdQuery,
  useUpdateTicketStatusMutation,
  useAssignTicketMutation,
  useGetEvidenceViewUrlQuery,
} from "../../features/tickets/ticketApi";
import { useGetProjectMembersQuery } from "../../features/projects/projectApi";
import {
  Ticket,
  TicketProject,
  TicketUser,
  TicketStatus,
  TicketEvidenceFile,
} from "../../features/tickets/types";
import { ProjectMembership, ProjectMemberUser } from "../../features/projects/types";

import TicketStatusBadge from "../../features/tickets/components/TicketStatusBadge";
import TicketSeverityBadge from "../../features/tickets/components/TicketSeverityBadge";
import EditTicketModal from "../../features/tickets/components/EditTicketModal";
import TicketActivityFeed from "../../features/tickets/components/TicketActivityFeed";
import TicketComments from "../../features/tickets/components/TicketComments";
import TicketSlaCard from "../../features/tickets/components/TicketSlaCard";
import { SatisfactionRatingWidget } from "../../features/tickets/components/SatisfactionRatingWidget";

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "triaged", label: "Triaged" },
  { value: "in_progress", label: "In Progress" },
  { value: "awaiting_client_response", label: "Awaiting Client Response" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "reopened", label: "Reopened" },
  { value: "rejected", label: "Rejected" },
  { value: "duplicate", label: "Duplicate" },
];

const ASSIGNABLE_ROLES = [
  "project_admin",
  "project_manager",
  "support_agent",
  "engineer",
];

const TicketEvidenceCard: React.FC<{ file: TicketEvidenceFile }> = ({ file }) => {
  const { data: res, isLoading } = useGetEvidenceViewUrlQuery(file.key, {
    skip: !file.key,
  });

  const viewUrl = res?.data?.url || file.url;
  const isImage = file.mimeType.startsWith("image/");

  if (isLoading) {
    return (
      <div className="h-32 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-600 mr-1.5" />
        Loading...
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="space-y-1">
        <a
          href={viewUrl}
          target="_blank"
          rel="noreferrer"
          className="block group overflow-hidden rounded-xl border border-slate-200 bg-slate-100 hover:border-indigo-400 transition shadow-2xs"
        >
          <img
            src={viewUrl}
            alt={file.originalName}
            className="w-full h-32 object-cover group-hover:scale-105 transition duration-300"
          />
        </a>
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span className="truncate font-semibold text-slate-700 max-w-[140px]" title={file.originalName}>
            {file.originalName}
          </span>
          <a
            href={viewUrl}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 hover:underline shrink-0 font-medium"
          >
            View
          </a>
        </div>
      </div>
    );
  }

  return (
    <a
      href={viewUrl}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs hover:border-indigo-300 hover:shadow-2xs transition group"
    >
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
        <span className="font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
          {file.originalName}
        </span>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
    </a>
  );
};

export const TicketDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: response, isLoading, isError, refetch } = useGetTicketByIdQuery(id || "", {
    skip: !id,
  });

  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateTicketStatusMutation();
  const [assignTicket, { isLoading: isAssigning }] = useAssignTicketMutation();

  const ticket: Ticket | undefined = response?.data;

  const projectId = ticket
    ? typeof ticket.projectId === "object"
      ? ticket.projectId._id
      : ticket.projectId
    : "";

  const { data: projectMembersData, isLoading: isMembersLoading } = useGetProjectMembersQuery(
    projectId,
    { skip: !projectId }
  );

  const projectMembers: ProjectMembership[] = Array.isArray(projectMembersData)
    ? projectMembersData
    : [];

  const assignableMembers = projectMembers.filter((m) =>
    ASSIGNABLE_ROLES.includes(m.role)
  );

  const getUserName = (user: TicketUser | string | null | undefined) => {
    if (!user) return "Unassigned";
    if (typeof user === "string") return "User";
    return user.name || user.email || "User";
  };

  const getProjectName = (project: TicketProject | string | undefined) => {
    if (!project) return "N/A";
    if (typeof project === "string") return "Project";
    return project.name || "Project";
  };

  const currentAssigneeId = ticket?.assigneeId
    ? typeof ticket.assigneeId === "object"
      ? ticket.assigneeId._id
      : ticket.assigneeId
    : "";

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket || newStatus === ticket.status) return;
    setFeedback(null);

    try {
      await updateStatus({
        ticketId: ticket._id,
        status: newStatus,
      }).unwrap();
      setFeedback({ type: "success", message: `Status updated to "${newStatus.replace(/_/g, " ")}"` });
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Failed to update ticket status";
      setFeedback({ type: "error", message: errMsg });
    }
  };

  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!ticket || newAssigneeId === currentAssigneeId) return;
    setFeedback(null);

    try {
      await assignTicket({
        ticketId: ticket._id,
        assigneeId: newAssigneeId,
      }).unwrap();
      setFeedback({ type: "success", message: "Ticket assigned successfully" });
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Failed to assign ticket";
      setFeedback({ type: "error", message: errMsg });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400 font-sans shadow-sm my-6">
        <div className="w-7 h-7 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
        Loading ticket details...
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="space-y-6 font-sans">
        <button
          type="button"
          onClick={() => navigate("/tickets")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </button>

        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-rose-800">
              Ticket Not Found
            </h3>
            <p className="text-xs text-rose-600 mt-1">
              The ticket you are trying to view does not exist or you do not have permission to view it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate("/tickets")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {/* Edit Ticket Button */}
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer active:scale-[0.98]"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Ticket</span>
          </button>

          {/* Interactive Status Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <div className="relative flex items-center gap-1.5">
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                disabled={isUpdatingStatus}
                className="text-xs font-bold text-slate-800 bg-transparent cursor-pointer focus:outline-none disabled:opacity-50"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {isUpdatingStatus ? (
                <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              ) : (
                <TicketStatusBadge status={ticket.status} />
              )}
            </div>
          </div>

          <TicketSeverityBadge severity={ticket.severity} />
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Ticket Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 mb-1">
            <span>#{ticket.ticketNumber}</span>
            {ticket.module && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-medium">{ticket.module}</span>
              </>
            )}
            {ticket.issueType && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-medium capitalize">{ticket.issueType}</span>
              </>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {ticket.title}
          </h1>
        </div>

        {/* Details Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Description & Activity Column */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Description
              </h2>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                {ticket.description}
              </div>
            </div>

            {/* Environment Details */}
            {(ticket.environment || ticket.applicationUrl || ticket.pageUrl) && (
              <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  Environment & URL Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
                  {ticket.environment && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-700">Environment:</span>{" "}
                      <span className="capitalize">{ticket.environment}</span>
                    </div>
                  )}
                  {ticket.applicationUrl && (
                    <div className="flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-700">App URL:</span>{" "}
                      <a
                        href={ticket.applicationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline truncate max-w-[180px]"
                      >
                        {ticket.applicationUrl}
                      </a>
                    </div>
                  )}
                  {ticket.pageUrl && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <Link2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-700">Page URL:</span>{" "}
                      <a
                        href={ticket.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline truncate max-w-full"
                      >
                        {ticket.pageUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ticket Evidence Files Gallery */}
            {ticket.evidenceFiles && ticket.evidenceFiles.length > 0 && (
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    Ticket Evidence Files ({ticket.evidenceFiles.length})
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    Click to view or download
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {ticket.evidenceFiles.map((file) => (
                    <TicketEvidenceCard key={file.key} file={file} />
                  ))}
                </div>
              </div>
            )}

            {/* CSAT Rating Prompt for Resolved / Closed Tickets (BR-TRK-006) */}
            {(ticket.status === "resolved" || ticket.status === "closed") && (
              <SatisfactionRatingWidget
                ticketId={ticket._id}
                existingRating={ticket.satisfactionRating}
                onSuccess={() => refetch()}
              />
            )}

            {/* Comments & Internal Notes Section */}
            <TicketComments ticketId={ticket._id} />

            {/* Activity / History Timeline Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <History className="w-4 h-4 text-indigo-600" />
                Ticket Activity & Audit History
              </h2>
              <TicketActivityFeed ticketId={ticket._id} />
            </div>
          </div>

          {/* Sidebar Info Column */}
          <div className="space-y-4 font-sans">
            {/* SLA Clock Card */}
            <TicketSlaCard ticket={ticket} />

            <div className="space-y-4 bg-slate-50/80 p-4 rounded-xl border border-slate-100 text-xs">
              {/* Project */}
              <div className="flex items-center gap-3">
                <FolderKanban className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-slate-400 font-medium text-[11px]">Project</p>
                  <p className="font-semibold text-slate-800">
                    {getProjectName(ticket.projectId)}
                  </p>
                </div>
              </div>

            {/* Module */}
            {ticket.module && (
              <div className="flex items-center gap-3">
                <Layers3 className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-slate-400 font-medium text-[11px]">Module</p>
                  <p className="font-semibold text-slate-800">{ticket.module}</p>
                </div>
              </div>
            )}

            {/* Requester */}
            <div className="flex items-center gap-3">
              <UserRound className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-slate-400 font-medium text-[11px]">Requester</p>
                <p className="font-semibold text-slate-800">
                  {getUserName(ticket.requesterId)}
                </p>
              </div>
            </div>

            {/* Assignee / Re-assignment Widget */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserRound className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="text-slate-400 font-medium text-[11px]">Assignee</span>
                </div>
                {isAssigning && <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />}
              </div>

              <div className="pl-6">
                <p className="font-bold text-slate-900 mb-1.5">
                  {getUserName(ticket.assigneeId)}
                </p>

                {/* Assign / Reassign Selector */}
                <div className="relative">
                  <select
                    value={currentAssigneeId}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    disabled={isAssigning || isMembersLoading}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled>
                      {currentAssigneeId ? "-- Re-assign Ticket --" : "-- Select Assignee --"}
                    </option>
                    {assignableMembers.map((member) => {
                      const memberUser =
                        typeof member.userId === "object"
                          ? (member.userId as ProjectMemberUser)
                          : null;
                      const memberUserId = memberUser ? memberUser._id : (member.userId as string);
                      const name = memberUser ? memberUser.name : "Team Member";
                      const roleLabel = member.role.replace(/_/g, " ");

                      return (
                        <option key={member._id} value={memberUserId}>
                          {name} ({roleLabel})
                        </option>
                      );
                    })}
                  </select>
                </div>
                {isMembersLoading && (
                  <p className="text-[10px] text-slate-400 mt-1">Loading team members...</p>
                )}
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60">
              <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-slate-400 font-medium text-[11px]">Created</p>
                <p className="font-medium text-slate-700">
                  {new Date(ticket.createdAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Updated At */}
            <div className="flex items-center gap-3">
              <Clock3 className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-slate-400 font-medium text-[11px]">Last Updated</p>
                <p className="font-medium text-slate-700">
                  {new Date(ticket.updatedAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Edit Ticket Modal */}
      {isEditModalOpen && (
        <EditTicketModal
          ticket={ticket}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
};

export default TicketDetailsPage;


