import React, { useEffect, useState } from "react";
import {
  Plus,
  Ticket as TicketIcon,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  AlertCircle,
  Download,
} from "lucide-react";

import { useSearchTicketsQuery } from "../../features/tickets/ticketApi";
import { useGetMyProjectsQuery } from "../../features/projects/projectApi";

import {
  TicketSeverity,
  TicketStatus,
  Ticket,
} from "../../features/tickets/types";
import { Project } from "../../features/projects/types";

import TicketFilters from "../../features/tickets/components/TicketFilters";
import TicketTable from "../../features/tickets/components/TicketTable";

import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface TicketsPageProps {
  preset?: "my" | "team";
}

export const TicketsPage: React.FC<TicketsPageProps> = ({ preset }) => {
  const navigate = useNavigate();
  const { isClient, token, user } = useAuth();

  const isTeamConsole = preset === "team";
  const isMyTickets = preset === "my";

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [severity, setSeverity] = useState<TicketSeverity | "">("");
  const [moduleName, setModuleName] = useState<string>("");
  const [page, setPage] = useState(1);

  const limit = 20;

  // Load user's projects for project filter dropdown and modules list
  const { data: projectsData } = useGetMyProjectsQuery();
  const userMemberships = projectsData || [];

  // Derive selected project object
  const selectedMembership = userMemberships.find((m) => {
    const p = typeof m.projectId === "object" ? (m.projectId as Project) : null;
    return p?._id === selectedProjectId;
  });

  const selectedProject =
    typeof selectedMembership?.projectId === "object"
      ? (selectedMembership.projectId as Project)
      : null;

  // Extract modules list from selected project or combine from user projects
  const availableModules: string[] = selectedProject?.modules
    ? selectedProject.modules.filter((m) => m.isActive).map((m) => m.name)
    : Array.from(
        new Set(
          userMemberships.flatMap((m) => {
            const p =
              typeof m.projectId === "object" ? (m.projectId as Project) : null;
            return p?.modules
              ? p.modules.filter((mod) => mod.isActive).map((mod) => mod.name)
              : [];
          })
        )
      );

  // Single server-side search query
  const {
    data: ticketsResponse,
    isLoading,
    isFetching,
    isError,
  } = useSearchTicketsQuery({
    projectId: selectedProjectId || undefined,
    requesterId: isMyTickets ? (user?.id || user?._id) : undefined,
    search: search || undefined,
    status: status || undefined,
    severity: severity || undefined,
    module: moduleName || undefined,
    page,
    limit,
  });

  const tickets: Ticket[] = ticketsResponse?.data ?? [];
  const pagination = ticketsResponse?.pagination;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedProjectId, search, status, severity, moduleName]);

  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
    setSeverity("");
    setModuleName("");
    setSelectedProjectId("");
    setPage(1);
  };

  const totalPages = pagination?.totalPages ?? 1;
  const isInitialLoading = isLoading && tickets.length === 0;

  const handleExportCsv = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const params = new URLSearchParams();
      if (selectedProjectId) params.append("projectId", selectedProjectId);

      const res = await fetch(`${baseUrl}/reports/export?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to export CSV");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tickets_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[CSV Export Error]:", err);
    }
  };

  const handleExportPdf = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const params = new URLSearchParams();
      if (selectedProjectId) params.append("projectId", selectedProjectId);

      const res = await fetch(`${baseUrl}/reports/export-pdf?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to generate PDF report");

      const htmlText = await res.text();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlText);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (err) {
      console.error("[PDF Export Error]:", err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <TicketIcon className="w-5 h-5" />
            </div>

            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isTeamConsole
                ? "Team Support Console"
                : isMyTickets
                ? "My Support Tickets"
                : "Support Tickets Console"}
            </h1>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            {isTeamConsole
              ? "Cross-project ticket queue, triage, and SLA management for support team."
              : isMyTickets
              ? "Track and manage support requests submitted by you."
              : "Manage and resolve tickets across your project workspaces."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs active:scale-[0.98] transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs active:scale-[0.98] transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-rose-600" />
            Export PDF
          </button>

          <button
            type="button"
            onClick={() => navigate("/tickets/new")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm active:scale-[0.98] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Ticket
          </button>
        </div>
      </div>

      {/* Project Selector Bar */}
      {userMemberships.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800">
              Project Context:
            </span>
          </div>

          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-600 transition cursor-pointer max-w-xs w-full"
          >
            <option value="">All My Projects (Overview)</option>
            {userMemberships.map((membership) => {
              const project =
                typeof membership.projectId === "object"
                  ? (membership.projectId as Project)
                  : null;
              if (!project) return null;

              return (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Filters Bar */}
      <TicketFilters
        search={search}
        status={status}
        severity={severity}
        module={moduleName}
        modules={availableModules}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onSeverityChange={setSeverity}
        onModuleChange={setModuleName}
        onClear={handleClearFilters}
      />

      {/* Summary */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-slate-500 font-medium">
          {pagination?.total ?? 0}{" "}
          {(pagination?.total ?? 0) === 1 ? "ticket" : "tickets"}
        </p>

        {(search || status || severity || moduleName || selectedProjectId) && (
          <p className="text-[11px] text-slate-400 font-medium">
            Filtered results {isFetching && "(updating...)"}
          </p>
        )}
      </div>

      {/* Error State */}
      {isError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-rose-700">
              Failed to load tickets.
            </p>
            <p className="text-[11px] text-rose-500 mt-0.5">
              Please try again. If the problem continues, contact your administrator.
            </p>
          </div>
        </div>
      )}

      {/* Tickets Table */}
      {!isError && (
        <TicketTable
          tickets={tickets}
          isLoading={isInitialLoading}
        />
      )}

      {/* Pagination */}
      {!isError && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs">
          <p className="text-[11px] text-slate-500 font-medium">
            Page {pagination.page} of {pagination.totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setPage((current) => Math.max(1, current - 1))
              }
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) =>
                  Math.min(totalPages, current + 1)
                )
              }
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsPage;
