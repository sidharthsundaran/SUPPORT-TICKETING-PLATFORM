import { TicketSeverity } from "../models/Ticket.js";

export interface ISlaTarget {
  firstResponseHours: number;
  resolutionHours?: number;
  resolutionBusinessDays?: number;
}

export const DEFAULT_SLA_MATRIX: Record<TicketSeverity, ISlaTarget> = {
  critical: {
    firstResponseHours: 1,
    resolutionHours: 8,
  },
  high: {
    firstResponseHours: 2,
    resolutionHours: 24,
  },
  medium: {
    firstResponseHours: 4,
    resolutionBusinessDays: 3,
  },
  low: {
    firstResponseHours: 8,
    resolutionBusinessDays: 5,
  },
  enhancement: {
    firstResponseHours: 24,
    resolutionBusinessDays: 10,
  },
};
