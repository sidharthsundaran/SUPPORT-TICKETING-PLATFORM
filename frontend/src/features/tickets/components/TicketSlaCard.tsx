import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  PauseCircle,
  ShieldAlert,
} from "lucide-react";
import { Ticket } from "../types";

interface TicketSlaCardProps {
  ticket: Ticket;
}

export const TicketSlaCard: React.FC<TicketSlaCardProps> = ({ ticket }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000); // refresh every 10s
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (targetDateStr?: string) => {
    if (!targetDateStr) return "Not set";
    const target = new Date(targetDateStr);
    const diffMs = target.getTime() - now.getTime();

    if (diffMs <= 0) {
      const pastMs = Math.abs(diffMs);
      const hours = Math.floor(pastMs / (1000 * 60 * 60));
      const mins = Math.floor((pastMs % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `Overdue by ${days}d ${hours % 24}h`;
      }
      return `Overdue by ${hours}h ${mins}m`;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h left`;
    }
    return `${hours}h ${mins}m left`;
  };

  const isPaused =
    ticket.status === "awaiting_client_response" || Boolean(ticket.slaClock?.pausedAt);
  const isResolvedOrClosed = ["resolved", "closed", "rejected", "duplicate"].includes(
    ticket.status
  );

  // First Response SLA status
  const getFirstResponseBadge = () => {
    if (ticket.slaFirstResponseStatus === "met") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Met
        </span>
      );
    }
    if (ticket.slaFirstResponseStatus === "breached") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertOctagon className="w-3 h-3 text-rose-600" />
          Breached
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <Clock className="w-3 h-3 text-blue-600" />
        Pending
      </span>
    );
  };

  // Resolution SLA status
  const getResolutionBadge = () => {
    if (isPaused) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <PauseCircle className="w-3 h-3 text-amber-600" />
          Clock Paused
        </span>
      );
    }
    if (ticket.slaResolutionStatus === "breached") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertOctagon className="w-3 h-3 text-rose-600" />
          Breached
        </span>
      );
    }
    if (ticket.slaResolutionStatus === "approaching_breach") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          At Risk (75%)
        </span>
      );
    }
    if (isResolvedOrClosed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Resolved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Clock className="w-3 h-3 text-emerald-600" />
        On Track
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 text-indigo-600" />
          SLA Targets & Clocks
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {/* First Response Clock */}
        <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <p className="text-[11px] font-bold text-slate-700">First Response SLA</p>
            <p className="text-[10px] text-slate-500">
              {ticket.firstResponseAt
                ? `Responded ${new Date(ticket.firstResponseAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : formatCountdown(ticket.slaFirstResponseDueAt)}
            </p>
          </div>
          {getFirstResponseBadge()}
        </div>

        {/* Resolution Clock */}
        <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <p className="text-[11px] font-bold text-slate-700">Resolution SLA</p>
            <p className="text-[10px] text-slate-500">
              {isResolvedOrClosed && ticket.resolvedAt
                ? `Resolved ${new Date(ticket.resolvedAt).toLocaleDateString()}`
                : isPaused
                ? "Paused (Awaiting client)"
                : formatCountdown(ticket.slaResolutionDueAt)}
            </p>
          </div>
          {getResolutionBadge()}
        </div>
      </div>
    </div>
  );
};

export default TicketSlaCard;
