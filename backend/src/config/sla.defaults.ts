import { TicketSeverity } from "../models/Ticket.js";

export interface ISlaTarget {
  firstResponseHours?: number;
  firstResponseBusinessDays?: number;
  resolutionHours?: number;
  resolutionBusinessDays?: number;
  qualitativeTarget?: string;
}

export const DEFAULT_SLA_MATRIX: Record<TicketSeverity, ISlaTarget> = {
  critical: {
    firstResponseHours: 1,
    resolutionHours: 8,
  },
  high: {
    firstResponseHours: 4,
    resolutionBusinessDays: 2,
  },
  medium: {
    firstResponseHours: 8,
    resolutionBusinessDays: 5,
  },
  low: {
    firstResponseBusinessDays: 1,
    resolutionBusinessDays: 10,
    qualitativeTarget: "Next scheduled release",
  },
  enhancement: {
    firstResponseBusinessDays: 2,
    resolutionBusinessDays: 15,
    qualitativeTarget: "Per backlog grooming",
  },
};
