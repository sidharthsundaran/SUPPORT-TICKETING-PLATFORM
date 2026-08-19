import { TicketSeverity } from "../models/Ticket.js";
import { DEFAULT_SLA_MATRIX, ISlaTarget } from "../config/sla.defaults.js";

/**
 * Adds business days (skipping Saturday and Sunday) to a given start date.
 */
export function addBusinessDays(startDate: Date, days: number): Date {
  const result = new Date(startDate);
  let added = 0;

  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    // 0 is Sunday, 6 is Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }

  return result;
}

/**
 * Resolves SLA target for a given severity, combining project overrides with defaults.
 */
export function getSlaTarget(
  severity: TicketSeverity,
  projectMatrix?: Partial<Record<TicketSeverity, ISlaTarget>>
): ISlaTarget {
  const custom = projectMatrix?.[severity];
  const defaultTarget = DEFAULT_SLA_MATRIX[severity] || DEFAULT_SLA_MATRIX.medium;

  return {
    firstResponseHours: custom?.firstResponseHours ?? defaultTarget.firstResponseHours,
    resolutionHours: custom?.resolutionHours ?? defaultTarget.resolutionHours,
    resolutionBusinessDays: custom?.resolutionBusinessDays ?? defaultTarget.resolutionBusinessDays,
  };
}

/**
 * Calculates the first response deadline timestamp.
 */
export function calculateFirstResponseDueAt(
  startDate: Date,
  severity: TicketSeverity,
  projectMatrix?: Partial<Record<TicketSeverity, ISlaTarget>>
): Date {
  const target = getSlaTarget(severity, projectMatrix);
  const due = new Date(startDate.getTime());
  due.setHours(due.getHours() + target.firstResponseHours);
  return due;
}

/**
 * Calculates the resolution deadline timestamp.
 */
export function calculateResolutionDueAt(
  startDate: Date,
  severity: TicketSeverity,
  projectMatrix?: Partial<Record<TicketSeverity, ISlaTarget>>
): Date {
  const target = getSlaTarget(severity, projectMatrix);

  if (target.resolutionBusinessDays) {
    return addBusinessDays(startDate, target.resolutionBusinessDays);
  }

  const hours = target.resolutionHours || 48; // fallback
  const due = new Date(startDate.getTime());
  due.setHours(due.getHours() + hours);
  return due;
}
