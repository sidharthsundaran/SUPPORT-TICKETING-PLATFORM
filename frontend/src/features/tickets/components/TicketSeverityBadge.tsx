import React from "react";
import { TicketSeverity } from "../types";

interface TicketSeverityBadgeProps {
  severity: TicketSeverity;
}

const labels: Record<TicketSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  enhancement: "Enhancement",
};

const styles: Record<TicketSeverity, string> = {
  critical: "bg-rose-50 text-rose-700 border-rose-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-blue-50 text-blue-700 border-blue-200",
  enhancement: "bg-violet-50 text-violet-700 border-violet-200",
};

export const TicketSeverityBadge: React.FC<
  TicketSeverityBadgeProps
> = ({ severity }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold ${styles[severity] || styles.medium}`}
    >
      {labels[severity] || severity}
    </span>
  );
};

export default TicketSeverityBadge;
