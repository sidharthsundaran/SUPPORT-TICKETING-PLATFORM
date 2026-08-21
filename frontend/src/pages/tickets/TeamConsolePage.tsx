import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket as TicketIcon,
  Search,
  Filter,
  Users,
  CheckSquare,
  Square,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Tag,
  RefreshCw,
} from 'lucide-react';

import {
  useGetTeamConsoleTicketsQuery,
  useBulkUpdateTicketsMutation,
} from '../../features/tickets/ticketApi';
import { useGetMyProjectsQuery } from '../../features/projects/projectApi';
import { Ticket, TicketSeverity, TicketStatus } from '../../features/tickets/types';
import TicketStatusBadge from '../../features/tickets/components/TicketStatusBadge';
import TicketSeverityBadge from '../../features/tickets/components/TicketSeverityBadge';
import { TicketContextDrawer } from '../../features/tickets/components/TicketContextDrawer';
import { useAuth } from '../../hooks/useAuth';

type PresetView = 'all' | 'unassigned' | 'my_open' | 'sla_at_risk' | 'critical_high';

export const TeamConsolePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [preset, setPreset] = useState<PresetView>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [severity, setSeverity] = useState<TicketSeverity | ''>('');
  const [moduleName, setModuleName] = useState<string>('');
  const [clientOrg, setClientOrg] = useState<string>('');
  const [slaState, setSlaState] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 20;

  // Selected Row State for Bulk Actions & Drawer
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [drawerTicket, setDrawerTicket] = useState<Ticket | null>(null);

  // Bulk Actions Form State
  const [bulkAssigneeId, setBulkAssigneeId] = useState<string>('');
  const [bulkStatus, setBulkStatus] = useState<TicketStatus | ''>('');
  const [bulkTag, setBulkTag] = useState<string>('');

  const { data: projectsData } = useGetMyProjectsQuery();
  const userMemberships = projectsData || [];

  const { data: ticketsResponse, isLoading, isFetching, refetch } = useGetTeamConsoleTicketsQuery({
    projectId: selectedProjectId || undefined,
    search: search || undefined,
    status: status || undefined,
    severity: severity || undefined,
    module: moduleName || undefined,
    clientOrganisation: clientOrg || undefined,
    preset: preset === 'all' ? undefined : preset,
    slaState: slaState || undefined,
    page,
    limit,
  });

  const [bulkUpdate, { isLoading: isBulkUpdating }] = useBulkUpdateTicketsMutation();

  const tickets: Ticket[] = ticketsResponse?.data ?? [];
  const pagination = ticketsResponse?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const toggleSelectAll = () => {
    if (selectedTicketIds.length === tickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(tickets.map((t) => t._id));
    }
  };

  const toggleSelectTicket = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTicketIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExecuteBulkAssign = async (assigneeId: string) => {
    if (selectedTicketIds.length === 0) return;
    try {
      await bulkUpdate({
        ticketIds: selectedTicketIds,
        update: { assigneeId: assigneeId === 'unassigned' ? null : assigneeId },
      }).unwrap();
      setSelectedTicketIds([]);
      setBulkAssigneeId('');
    } catch (err) {
      alert('Bulk assign failed');
    }
  };

  const handleExecuteBulkStatus = async (statusVal: TicketStatus) => {
    if (selectedTicketIds.length === 0) return;
    try {
      await bulkUpdate({
        ticketIds: selectedTicketIds,
        update: { status: statusVal },
      }).unwrap();
      setSelectedTicketIds([]);
      setBulkStatus('');
    } catch (err) {
      alert('Bulk status update failed');
    }
  };

  const handleExecuteAddTag = async () => {
    if (!bulkTag.trim() || selectedTicketIds.length === 0) return;
    try {
      await bulkUpdate({
        ticketIds: selectedTicketIds,
        update: { tags: [bulkTag.trim()] },
      }).unwrap();
      setSelectedTicketIds([]);
      setBulkTag('');
    } catch (err) {
      alert('Bulk tagging failed');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/20 text-white flex items-center justify-center font-bold">
              <TicketIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Team Support Console (BR-CON)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cross-project operational workspace for support agents, engineers, and project managers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs active:scale-[0.98] transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Preset Saved Views Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => { setPreset('all'); setPage(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            preset === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Tickets
        </button>

        <button
          type="button"
          onClick={() => { setPreset('unassigned'); setPage(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            preset === 'unassigned'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Unassigned
        </button>

        <button
          type="button"
          onClick={() => { setPreset('my_open'); setPage(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            preset === 'my_open'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          My Open Tickets
        </button>

        <button
          type="button"
          onClick={() => { setPreset('sla_at_risk'); setPage(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            preset === 'sla_at_risk'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
              : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
          }`}
        >
          SLA At Risk ⚠️
        </button>

        <button
          type="button"
          onClick={() => { setPreset('critical_high'); setPage(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            preset === 'critical_high'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
              : 'bg-white border border-slate-200 text-rose-700 hover:bg-rose-50'
          }`}
        >
          Critical / High 🚨
        </button>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedTicketIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-indigo-900 text-white flex flex-wrap items-center justify-between gap-4 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-700 text-white text-xs font-bold flex items-center justify-center">
              {selectedTicketIds.length}
            </span>
            <span className="text-xs font-bold">Ticket(s) Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Assign */}
            <select
              value={bulkAssigneeId}
              onChange={(e) => {
                setBulkAssigneeId(e.target.value);
                if (e.target.value) handleExecuteBulkAssign(e.target.value);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-800 text-white border border-indigo-700 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="">Bulk Assign To...</option>
              <option value={user?.id || user?._id}>Assign to Me</option>
              <option value="unassigned">Unassign</option>
            </select>

            {/* Status */}
            <select
              value={bulkStatus}
              onChange={(e) => {
                const val = e.target.value as TicketStatus;
                setBulkStatus(val);
                if (val) handleExecuteBulkStatus(val);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-800 text-white border border-indigo-700 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="">Bulk Status Change...</option>
              <option value="triaged">Triaged</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_client_response">Awaiting Client</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All Projects</option>
          {userMemberships.map((m) => {
            const p = typeof m.projectId === 'object' ? m.projectId : null;
            return p ? (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ) : null;
          })}
        </select>

        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as TicketSeverity | '')}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="enhancement">Enhancement</option>
        </select>

        <select
          value={slaState}
          onChange={(e) => setSlaState(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All SLA States</option>
          <option value="breached">SLA Breached 🚨</option>
          <option value="approaching_breach">SLA Approaching Breach ⚠️</option>
          <option value="met">SLA Met / On Track ✅</option>
        </select>
      </div>

      {/* Main Ticket Grid Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10">
                  <button type="button" onClick={toggleSelectAll} className="cursor-pointer text-slate-400">
                    {selectedTicketIds.length > 0 && selectedTicketIds.length === tickets.length ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Ticket</th>
                <th className="py-3.5 px-4">Client Org</th>
                <th className="py-3.5 px-4">Title & Module</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">SLA State</th>
                <th className="py-3.5 px-4">Assignee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading console tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No tickets found matching console filters. 🎉
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => {
                  const requester = typeof ticket.requesterId === 'object' ? ticket.requesterId : null;
                  const assignee = typeof ticket.assigneeId === 'object' ? ticket.assigneeId : null;
                  const project = typeof ticket.projectId === 'object' ? ticket.projectId : null;
                  const isSelected = selectedTicketIds.includes(ticket._id);
                  const sla = (ticket as any).sla;

                  return (
                    <tr
                      key={ticket._id}
                      onClick={() => setDrawerTicket(ticket)}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4" onClick={(e) => toggleSelectTicket(ticket._id, e)}>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-indigo-600 tracking-wider">
                          {ticket.ticketNumber}
                        </span>
                        {project && (
                          <span className="block text-[10px] text-slate-400">{project.name}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {ticket.clientOrganisation || 'Internal'}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-900 truncate">{ticket.title}</p>
                        <span className="text-[10px] text-slate-400">{ticket.module}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <TicketSeverityBadge severity={ticket.severity} />
                      </td>

                      <td className="py-3.5 px-4">
                        <TicketStatusBadge status={ticket.status} />
                      </td>

                      <td className="py-3.5 px-4">
                        {sla?.state === 'breached' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <ShieldAlert className="w-3 h-3" /> Breached
                          </span>
                        ) : sla?.state === 'approaching_breach' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> At Risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            On Track
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {assignee ? assignee.name : <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 disabled:opacity-50 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 disabled:opacity-50 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Context Drawer */}
      <TicketContextDrawer
        ticket={drawerTicket}
        isOpen={Boolean(drawerTicket)}
        onClose={() => setDrawerTicket(null)}
      />
    </div>
  );
};
