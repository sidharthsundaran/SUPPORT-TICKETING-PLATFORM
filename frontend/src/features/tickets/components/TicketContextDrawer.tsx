import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ExternalLink,
  Building2,
  User,
  Clock,
  ShieldAlert,
  Tag,
  Globe,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Ticket } from '../types';
import TicketStatusBadge from './TicketStatusBadge';
import TicketSeverityBadge from './TicketSeverityBadge';

interface TicketContextDrawerProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TicketContextDrawer: React.FC<TicketContextDrawerProps> = ({
  ticket,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !ticket) return null;

  const requester = typeof ticket.requesterId === 'object' ? ticket.requesterId : null;
  const project = typeof ticket.projectId === 'object' ? ticket.projectId : null;
  const assignee = typeof ticket.assigneeId === 'object' ? ticket.assigneeId : null;

  const sla = (ticket as any).sla;

  const getSlaBadge = () => {
    if (!sla) return null;
    if (sla.state === 'breached') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200">
          <ShieldAlert className="w-3.5 h-3.5" />
          SLA Breached
        </span>
      );
    }
    if (sla.state === 'approaching_breach') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5" />
          SLA Approaching Breach
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        SLA Within Target
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between z-10 animate-slideLeft">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs tracking-wider">
                {ticket.ticketNumber}
              </span>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
              {ticket.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ticket.description}</p>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <TicketStatusBadge status={ticket.status} />
              <TicketSeverityBadge severity={ticket.severity} />
              {getSlaBadge()}
            </div>
          </div>

          {/* Drawer Body Details */}
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {/* Requester & Client Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Requester & Organisation
              </h3>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Requester:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {requester ? requester.name : 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    Email:
                  </span>
                  <span className="font-medium text-slate-700">{requester?.email || 'N/A'}</span>
                </div>
                {ticket.clientOrganisation && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Client Org:
                    </span>
                    <span className="font-bold text-indigo-700">{ticket.clientOrganisation}</span>
                  </div>
                )}
              </div>
            </div>

            {/* System Context URLs */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Environment & App URLs
              </h3>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Environment:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold text-[11px]">
                    {ticket.environment || 'Production'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Affected Module:</span>
                  <span className="font-semibold text-slate-800">{ticket.module}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Issue Type:</span>
                  <span className="font-semibold text-slate-800">{ticket.issueType}</span>
                </div>

                {ticket.applicationUrl && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-[11px] text-slate-400 block mb-1">Application URL:</span>
                    <a
                      href={ticket.applicationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1 text-xs font-medium truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{ticket.applicationUrl}</span>
                    </a>
                  </div>
                )}

                {ticket.pageUrl && (
                  <div className="pt-1">
                    <span className="text-[11px] text-slate-400 block mb-1">Page URL:</span>
                    <a
                      href={ticket.pageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1 text-xs font-medium truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{ticket.pageUrl}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* SLA Countdown Status */}
            {sla && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  SLA Target Deadlines
                </h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      First Response Due:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {new Date(sla.firstResponseDueAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Resolution Target Due:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {new Date(sla.resolutionDueAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer Action */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/tickets/${ticket._id}`);
              }}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer active:scale-[0.99]"
            >
              <span>Open Full Ticket View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
