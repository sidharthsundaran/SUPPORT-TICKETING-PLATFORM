import React from "react";
import { Eye, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Ticket, TicketProject, TicketUser } from "../types";
import TicketStatusBadge from "./TicketStatusBadge";
import TicketSeverityBadge from "./TicketSeverityBadge";
import { useGetMyProjectsQuery } from "../../projects/projectApi";
import { Project } from "../../projects/types";

interface TicketTableProps {
  tickets: Ticket[];
  isLoading?: boolean;
}

const getName = (
  value: Ticket["requesterId"] | Ticket["assigneeId"]
) => {
  if (!value) return "Unassigned";

  if (typeof value === "string") {
    return "User";
  }

  return (value as TicketUser).name || "User";
};

export const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const { data: projectsData } = useGetMyProjectsQuery();
  const userMemberships = projectsData || [];

  const getProjectName = (project: Ticket["projectId"]) => {
    if (!project) return "N/A";
    if (typeof project === "object" && project.name) {
      return project.name;
    }

    const projId = typeof project === "string" ? project : project._id;

    const foundMembership = userMemberships.find((m) => {
      const p = typeof m.projectId === "object" ? (m.projectId as Project) : null;
      return p?._id === projId || m.projectId === projId;
    });

    if (foundMembership) {
      const p = typeof foundMembership.projectId === "object" ? (foundMembership.projectId as Project) : null;
      if (p?.name) return p.name;
    }

    return "Project";
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400 font-sans shadow-sm">
        <div className="w-7 h-7 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
        Loading tickets...
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center font-sans shadow-sm">
        <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
          <UserRound className="w-5 h-5" />
        </div>

        <h3 className="text-sm font-bold text-slate-900">
          No tickets found
        </h3>

        <p className="text-xs text-slate-400 mt-1">
          Try changing your filters or create a new support ticket.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Ticket
              </th>

              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Project
              </th>

              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Severity
              </th>

              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Status
              </th>

              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Requester
              </th>

              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Assignee
              </th>

              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Created
              </th>

              <th className="px-5 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <tr
                key={ticket._id}
                className="hover:bg-slate-50/70 transition"
              >
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/tickets/${ticket._id}`)
                    }
                    className="text-left cursor-pointer group"
                  >
                    <p className="text-[11px] font-bold text-indigo-600 group-hover:underline">
                      #{ticket.ticketNumber}
                    </p>

                    <p className="text-xs font-semibold text-slate-900 mt-1 max-w-xs truncate group-hover:text-indigo-600 transition">
                      {ticket.title}
                    </p>
                  </button>
                </td>

                <td className="px-5 py-4 text-xs text-slate-600 font-medium">
                  {getProjectName(ticket.projectId)}
                </td>

                <td className="px-5 py-4">
                  <TicketSeverityBadge
                    severity={ticket.severity}
                  />
                </td>

                <td className="px-5 py-4">
                  <TicketStatusBadge status={ticket.status} />
                </td>

                <td className="px-5 py-4">
                  <p className="text-xs font-semibold text-slate-800">
                    {getName(ticket.requesterId)}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="text-xs text-slate-600 font-medium">
                    {getName(ticket.assigneeId)}
                  </p>
                </td>

                <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                  {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>

                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/tickets/${ticket._id}`)
                    }
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                    title="View ticket details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketTable;
