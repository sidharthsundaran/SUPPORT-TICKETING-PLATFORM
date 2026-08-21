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
    firstResponseBusinessDays: custom?.firstResponseBusinessDays ?? defaultTarget.firstResponseBusinessDays,
    resolutionHours: custom?.resolutionHours ?? defaultTarget.resolutionHours,
    resolutionBusinessDays: custom?.resolutionBusinessDays ?? defaultTarget.resolutionBusinessDays,
    qualitativeTarget: custom?.qualitativeTarget ?? defaultTarget.qualitativeTarget,
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

  if (target.firstResponseBusinessDays) {
    return addBusinessDays(startDate, target.firstResponseBusinessDays);
  }

  const hours = target.firstResponseHours || 8;
  const due = new Date(startDate.getTime());
  due.setHours(due.getHours() + hours);
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

  const hours = target.resolutionHours || 48;
  const due = new Date(startDate.getTime());
  due.setHours(due.getHours() + hours);
  return due;
}

export interface TicketSlaInfo {
  state: "within_sla" | "approaching_breach" | "breached";
  firstResponseDueAt: Date;
  resolutionDueAt: Date;
  responseRemainingSeconds: number;
  resolutionRemainingSeconds: number;
  isFirstResponseBreached: boolean;
  isResolutionBreached: boolean;
}

/**
 * Computes full real-time SLA metrics for a given ticket.
 */
export function calculateTicketSlaInfo(
  ticket: { createdAt: Date; severity: TicketSeverity; firstRespondedAt?: Date; resolvedAt?: Date },
  projectMatrix?: Partial<Record<TicketSeverity, ISlaTarget>>
): TicketSlaInfo {
  const createdDate = new Date(ticket.createdAt);
  const firstResponseDueAt = calculateFirstResponseDueAt(createdDate, ticket.severity, projectMatrix);
  const resolutionDueAt = calculateResolutionDueAt(createdDate, ticket.severity, projectMatrix);

  const now = new Date().getTime();

  const responseDiffMs = firstResponseDueAt.getTime() - (ticket.firstRespondedAt ? new Date(ticket.firstRespondedAt).getTime() : now);
  const resolutionDiffMs = resolutionDueAt.getTime() - (ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : now);

  const responseRemainingSeconds = Math.floor(responseDiffMs / 1000);
  const resolutionRemainingSeconds = Math.floor(resolutionDiffMs / 1000);

  const isFirstResponseBreached = !ticket.firstRespondedAt && responseRemainingSeconds < 0;
  const isResolutionBreached = !ticket.resolvedAt && resolutionRemainingSeconds < 0;

  const isApproachingBreach =
    (!ticket.firstRespondedAt && responseRemainingSeconds > 0 && responseRemainingSeconds <= 7200) ||
    (!ticket.resolvedAt && resolutionRemainingSeconds > 0 && resolutionRemainingSeconds <= 14400);

  let state: "within_sla" | "approaching_breach" | "breached" = "within_sla";
  if (isFirstResponseBreached || isResolutionBreached) {
    state = "breached";
  } else if (isApproachingBreach) {
    state = "approaching_breach";
  }

  return {
    state,
    firstResponseDueAt,
    resolutionDueAt,
    responseRemainingSeconds,
    resolutionRemainingSeconds,
    isFirstResponseBreached,
    isResolutionBreached,
  };
}
