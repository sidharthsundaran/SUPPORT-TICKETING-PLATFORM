import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { TicketSeverity, TicketStatus } from "../types";

interface TicketFiltersProps {
  search: string;
  status: TicketStatus | "";
  severity: TicketSeverity | "";
  slaStatus?: string;

  onSearchChange: (value: string) => void;
  onStatusChange: (value: TicketStatus | "") => void;
  onSeverityChange: (value: TicketSeverity | "") => void;
  onSlaStatusChange?: (value: string) => void;
  onClear: () => void;
}

const statuses: {
  value: TicketStatus;
  label: string;
}[] = [
    { value: "new", label: "New" },
    { value: "triaged", label: "Triaged" },
    { value: "in_progress", label: "In Progress" },
    {
      value: "awaiting_client_response",
      label: "Awaiting Client",
    },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
    { value: "reopened", label: "Reopened" },
    { value: "rejected", label: "Rejected" },
    { value: "duplicate", label: "Duplicate" },
  ];

const severities: {
  value: TicketSeverity;
  label: string;
}[] = [
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
    { value: "enhancement", label: "Enhancement" },
  ];

const slaStates = [
  { value: "breached", label: "SLA Breached 🚨" },
  { value: "at_risk", label: "SLA Approaching Breach ⚠️" },
  { value: "met", label: "SLA Met / On Track ✅" },
];

export const TicketFilters: React.FC<TicketFiltersProps> = ({
  search,
  status,
  severity,
  slaStatus = "",
  onSearchChange,
  onStatusChange,
  onSeverityChange,
  onSlaStatusChange,
  onClear,
}) => {
  const hasFilters = Boolean(search || status || severity || slaStatus);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="w-4 h-4 text-indigo-600" />

        <h2 className="text-sm font-bold text-slate-900">
          Filters & Search
        </h2>

        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 transition cursor-pointer"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
        </div>

        {/* Status */}
        <select
          value={status}
          onChange={(e) =>
            onStatusChange(e.target.value as TicketStatus | "")
          }
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        >
          <option value="">All statuses</option>

          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        {/* Severity */}
        <select
          value={severity}
          onChange={(e) =>
            onSeverityChange(
              e.target.value as TicketSeverity | ""
            )
          }
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        >
          <option value="">All severities</option>

          {severities.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        {/* SLA State Filter */}
        <select
          value={slaStatus}
          onChange={(e) => onSlaStatusChange && onSlaStatusChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        >
          <option value="">All SLA States</option>
          {slaStates.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TicketFilters;