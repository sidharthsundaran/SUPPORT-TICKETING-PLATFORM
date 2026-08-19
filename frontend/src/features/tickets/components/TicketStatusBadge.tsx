import React from "react";
import { TicketStatus } from "../types";

interface TicketStatusBadgeProps {
  status: TicketStatus;
}

const statusLabels: Record<TicketStatus, string> = {
  new: "New",
  triaged: "Triaged",
  in_progress: "In Progress",
  awaiting_client_response: "Awaiting Client",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
  rejected: "Rejected",
  duplicate: "Duplicate",
};

const statusStyles: Record<TicketStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  triaged: "bg-violet-50 text-violet-700 border-violet-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  awaiting_client_response:
    "bg-orange-50 text-orange-700 border-orange-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
  reopened: "bg-indigo-50 text-indigo-700 border-indigo-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  duplicate: "bg-slate-100 text-slate-600 border-slate-200",
};

export const TicketStatusBadge: React.FC<
  TicketStatusBadgeProps
> = ({ status }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
        statusStyles[status] || statusStyles.new
      }`}
    >
      {statusLabels[status] || status}
    </span>
  );
};

export default TicketStatusBadge;
