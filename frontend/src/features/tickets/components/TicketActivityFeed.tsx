import React from "react";
import {
  Clock,
  UserCheck,
  Tag,
  AlertCircle,
  Edit3,
  PlusCircle,
  Activity,
} from "lucide-react";
import { useGetTicketActivitiesQuery } from "../ticketApi";

interface TicketActivityFeedProps {
  ticketId: string;
}

export const TicketActivityFeed: React.FC<TicketActivityFeedProps> = ({
  ticketId,
}) => {
  const { data: response, isLoading } = useGetTicketActivitiesQuery(ticketId, {
    skip: !ticketId,
  });

  const activities = response?.data || [];

  const getActorName = (actor: any) => {
    if (!actor) return "User";
    if (typeof actor === "string") return "User";
    return actor.name || actor.email || "User";
  };

  const renderActionDescription = (act: any) => {
    const formatVal = (val: any) => (val ? String(val).replace(/_/g, " ") : "N/A");

    switch (act.action) {
      case "created":
        return <span className="text-slate-700">created this ticket</span>;
      case "status_changed":
        return (
          <span className="text-slate-700">
            changed status from{" "}
            <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] capitalize">
              {formatVal(act.oldValue)}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] capitalize">
              {formatVal(act.newValue)}
            </span>
          </span>
        );
      case "assignee_changed":
        return (
          <span className="text-slate-700">
            updated assignment for this ticket
          </span>
        );
      case "severity_changed":
        return (
          <span className="text-slate-700">
            changed severity from{" "}
            <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] capitalize">
              {formatVal(act.oldValue)}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] capitalize">
              {formatVal(act.newValue)}
            </span>
          </span>
        );
      case "details_updated":
        return <span className="text-slate-700">updated ticket details</span>;
      default:
        return <span className="text-slate-700">updated ticket</span>;
    }
  };

  const renderIcon = (action: string) => {
    switch (action) {
      case "created":
        return <PlusCircle className="w-4 h-4 text-emerald-600" />;
      case "status_changed":
        return <Clock className="w-4 h-4 text-indigo-600" />;
      case "assignee_changed":
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case "severity_changed":
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case "details_updated":
        return <Edit3 className="w-4 h-4 text-slate-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 space-y-2">
        <div className="w-5 h-5 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p>Loading activity history...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400">
        No activity history recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {activities.map((act) => (
          <div key={act._id} className="relative flex items-start gap-3 text-xs">
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
              {renderIcon(act.action)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-slate-900">
                  {getActorName(act.actorId)}
                </span>
                {renderActionDescription(act)}
              </div>

              <p className="text-[10px] text-slate-400 mt-0.5">
                {new Date(act.createdAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketActivityFeed;
