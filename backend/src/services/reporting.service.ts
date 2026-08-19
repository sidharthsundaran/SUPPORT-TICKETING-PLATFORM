import redisConnection from "../config/redis.js";
import { projectMembershipRepository } from "../repositories/project-membership.repository.js";
import {
  reportingRepository,
  ReportingRepository,
  DashboardFilterQuery,
} from "../repositories/reporting.repository.js";
import { IUser } from "../models/user.js";

export interface FormattedDashboardMetrics {
  kpis: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    avgFirstResponseFormatted: string;
    avgResolutionFormatted: string;
  };
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  byModule: Array<{ name: string; count: number }>;
  byClientOrg: Array<{ name: string; count: number }>;
  byModuleAndIssueType: Array<{ pattern: string; count: number }>;
  overTime: Array<{ date: string; created: number; resolved: number }>;
  sla: {
    slaMetCount: number;
    slaBreachedCount: number;
    compliancePercentage: number;
  };
  activeBreaches: Array<{
    _id: string;
    ticketNumber: string;
    title: string;
    severity: string;
    status: string;
    slaResolutionDueAt?: Date;
    slaResolutionStatus: string;
  }>;
}

export class ReportingService {
  constructor(
    private readonly repo: ReportingRepository = reportingRepository
  ) {}

  /**
   * Helper to format milliseconds to human-readable strings e.g. "24m", "1h 15m", "2d 4h"
   */
  private formatDurationMs(ms: number | null | undefined): string {
    if (!ms || ms <= 0) return "N/A";
    const minutes = Math.floor(ms / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    if (hours < 24) return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  }

  /**
   * Enforce Role Scoping Rules (BR-RPT-001)
   */
  async resolveFilterForUser(user: IUser, requestedProjectId?: string): Promise<DashboardFilterQuery> {
    const filter: DashboardFilterQuery = {};

    if (user.isPlatformAdmin) {
      if (requestedProjectId) filter.projectId = requestedProjectId;
      return filter;
    }

    // Non-platform admin: resolve project memberships
    const memberships = await projectMembershipRepository.findByUser(user._id.toString());
    const userProjectIds = memberships.map((m) =>
      typeof m.projectId === "object" && (m.projectId as any)._id
        ? (m.projectId as any)._id.toString()
        : m.projectId.toString()
    );

    if (user.userType === "client") {
      // Client User Scope: strictly projects user is part of
      if (requestedProjectId) {
        if (userProjectIds.includes(requestedProjectId)) {
          filter.projectId = requestedProjectId;
        } else {
          // User requested a project they aren't part of -> force non-matching filter
          filter.projectId = "invalid_id_no_access";
        }
      } else {
        filter.projectIds = userProjectIds;
      }
    } else {
      // Internal Staff Scope
      if (requestedProjectId) {
        if (userProjectIds.includes(requestedProjectId)) {
          filter.projectId = requestedProjectId;
        } else {
          filter.projectId = "invalid_id_no_access";
        }
      } else {
        filter.projectIds = userProjectIds;
      }
    }

    return filter;
  }

  /**
   * Get Dashboard Metrics with Redis Caching
   */
  async getDashboardMetrics(
    user: IUser,
    requestedProjectId?: string,
    startDateStr?: string,
    endDateStr?: string
  ): Promise<FormattedDashboardMetrics> {
    const userIdStr = user._id.toString();
    const cacheKey = `dashboard:${userIdStr}:${requestedProjectId || "all"}:${startDateStr || "all"}:${endDateStr || "all"}`;

    // 1. Try Redis Cache Read
    try {
      if (redisConnection && redisConnection.status === "ready") {
        const cached = await redisConnection.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }
    } catch (err) {
      console.error("[Redis Cache Read Error]:", err);
    }

    // 2. Resolve Role Scope
    const filter = await this.resolveFilterForUser(user, requestedProjectId);

    if (startDateStr) filter.startDate = new Date(startDateStr);
    if (endDateStr) filter.endDate = new Date(endDateStr);

    // 3. Query Database Repository
    const raw = await this.repo.getDashboardMetrics(filter);

    const kpisRaw = raw.kpis[0] || {
      totalTickets: 0,
      openTickets: 0,
      resolvedTickets: 0,
      avgFirstResponseMs: null,
      avgResolutionMs: null,
    };

    const slaRaw = raw.sla[0] || {
      slaMetCount: 0,
      slaBreachedCount: 0,
    };

    const totalSlaEvaluated = slaRaw.slaMetCount + slaRaw.slaBreachedCount;
    const compliancePercentage =
      totalSlaEvaluated > 0
        ? Math.round((slaRaw.slaMetCount / totalSlaEvaluated) * 100)
        : 100;

    const bySeverityMap: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      enhancement: 0,
    };
    raw.bySeverity.forEach((item) => {
      if (item._id) bySeverityMap[item._id] = item.count;
    });

    const byStatusMap: Record<string, number> = {};
    raw.byStatus.forEach((item) => {
      if (item._id) byStatusMap[item._id] = item.count;
    });

    const byModuleList = raw.byModule
      .filter((item) => item._id)
      .map((item) => ({ name: item._id, count: item.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const byClientOrgList = raw.byClientOrg
      .filter((item) => item._id)
      .map((item) => ({ name: item._id, count: item.count }))
      .sort((a, b) => b.count - a.count);

    const byModuleAndIssueTypeList = raw.byModuleAndIssueType
      .filter((item) => item._id && item._id.module)
      .map((item) => ({
        pattern: `${item._id.module} • ${item._id.issueType || "General"}`,
        count: item.count,
      }))
      .slice(0, 10);

    const overTimeList = raw.overTime.map((item) => ({
      date: item._id,
      created: item.created,
      resolved: item.resolved,
    }));

    const activeBreachesFormatted = raw.activeBreaches.map((t) => ({
      _id: t._id.toString(),
      ticketNumber: t.ticketNumber,
      title: t.title,
      severity: t.severity,
      status: t.status,
      slaResolutionDueAt: t.slaResolutionDueAt,
      slaResolutionStatus: t.slaResolutionStatus || "within_sla",
    }));

    const result: FormattedDashboardMetrics = {
      kpis: {
        totalTickets: kpisRaw.totalTickets,
        openTickets: kpisRaw.openTickets,
        resolvedTickets: kpisRaw.resolvedTickets,
        avgFirstResponseFormatted: this.formatDurationMs(kpisRaw.avgFirstResponseMs),
        avgResolutionFormatted: this.formatDurationMs(kpisRaw.avgResolutionMs),
      },
      bySeverity: bySeverityMap,
      byStatus: byStatusMap,
      byModule: byModuleList,
      byClientOrg: byClientOrgList,
      byModuleAndIssueType: byModuleAndIssueTypeList,
      overTime: overTimeList,
      sla: {
        slaMetCount: slaRaw.slaMetCount,
        slaBreachedCount: slaRaw.slaBreachedCount,
        compliancePercentage,
      },
      activeBreaches: activeBreachesFormatted,
    };

    // 4. Redis Cache Write (5 min TTL)
    try {
      if (redisConnection && redisConnection.status === "ready") {
        await redisConnection.setex(cacheKey, 300, JSON.stringify(result));
      }
    } catch (err) {
      console.error("[Redis Cache Write Error]:", err);
    }

    return result;
  }

  /**
  /**
   * Generate Professional CSV Export String (BR-RPT-003)
   */
  async exportTicketsCsv(
    user: IUser,
    requestedProjectId?: string,
    startDateStr?: string,
    endDateStr?: string
  ): Promise<string> {
    const filter = await this.resolveFilterForUser(user, requestedProjectId);

    if (startDateStr) filter.startDate = new Date(startDateStr);
    if (endDateStr) filter.endDate = new Date(endDateStr);

    const tickets = await this.repo.getTicketsForExport(filter);

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const formatDate = (date?: Date | string) => {
      if (!date) return "N/A";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "N/A";
      return d.toISOString().replace("T", " ").substring(0, 19);
    };

    // Calculate Summary Stats
    const totalCount = tickets.length;
    const openCount = tickets.filter((t) =>
      ["new", "triaged", "in_progress", "awaiting_client_response"].includes(t.status)
    ).length;
    const resolvedCount = tickets.filter((t) =>
      ["resolved", "closed"].includes(t.status)
    ).length;
    const breachedCount = tickets.filter(
      (t) =>
        t.slaFirstResponseStatus === "breached" || t.slaResolutionStatus === "breached"
    ).length;
    const metCount = totalCount - breachedCount;
    const complianceRate = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 100;

    // Report Header & Executive Summary Block
    const summaryBlock = [
      ["=== SUPPORT TICKETING PLATFORM - EXECUTIVE REPORT ==="],
      [`Generated On`, new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC"],
      [`Generated By`, `${user.name} (${user.email})`],
      [`Total Tickets`, totalCount],
      [`Open Tickets`, openCount],
      [`Resolved Tickets`, resolvedCount],
      [`SLA Compliance Rate`, `${complianceRate}% (${metCount} Met / ${breachedCount} Breached)`],
      [""], // Blank separator
    ].map((row) => row.map(escapeCsv).join(","));

    // Table Column Headers
    const headers = [
      "Ticket #",
      "Title",
      "Project",
      "Module",
      "Issue Type",
      "Severity",
      "Status",
      "Requester Name",
      "Requester Email",
      "Assignee",
      "Created Date",
      "First Response Date",
      "Resolved Date",
      "First Response SLA",
      "Resolution SLA",
      "Overall SLA Status",
    ].map(escapeCsv).join(",");

    // Data Rows
    const dataRows = tickets.map((t) => {
      const projectName =
        typeof t.projectId === "object" && (t.projectId as any).name
          ? (t.projectId as any).name
          : "N/A";

      const requesterName =
        typeof t.requesterId === "object" && (t.requesterId as any).name
          ? (t.requesterId as any).name
          : "N/A";

      const requesterEmail =
        typeof t.requesterId === "object" && (t.requesterId as any).email
          ? (t.requesterId as any).email
          : "N/A";

      const assigneeName = t.assigneeId
        ? typeof t.assigneeId === "object" && (t.assigneeId as any).name
          ? (t.assigneeId as any).name
          : "Assigned Staff"
        : "Unassigned";

      const formattedStatus = t.status
        ? t.status.replace(/_/g, " ").toUpperCase()
        : "NEW";

      const formattedSeverity = t.severity
        ? t.severity.toUpperCase()
        : "MEDIUM";

      const firstResponseSla = t.slaFirstResponseStatus
        ? t.slaFirstResponseStatus.toUpperCase()
        : "PENDING";

      const resolutionSla = t.slaResolutionStatus
        ? t.slaResolutionStatus.toUpperCase()
        : "WITHIN SLA";

      const overallSla =
        t.slaResolutionStatus === "breached" || t.slaFirstResponseStatus === "breached"
          ? "BREACHED"
          : t.slaResolutionStatus === "approaching_breach"
          ? "AT RISK"
          : "MET";

      return [
        t.ticketNumber,
        t.title,
        projectName,
        t.module,
        t.issueType,
        formattedSeverity,
        formattedStatus,
        requesterName,
        requesterEmail,
        assigneeName,
        formatDate(t.createdAt),
        formatDate(t.firstResponseAt),
        formatDate(t.resolvedAt),
        firstResponseSla,
        resolutionSla,
        overallSla,
      ].map(escapeCsv).join(",");
    });

    return [...summaryBlock, headers, ...dataRows].join("\n");
  }

  /**
   * Generate Bordered & Styled Spreadsheet Report (Excel / HTML table format)
   */
  async exportStyledReport(
    user: IUser,
    requestedProjectId?: string,
    startDateStr?: string,
    endDateStr?: string
  ): Promise<string> {
    const filter = await this.resolveFilterForUser(user, requestedProjectId);

    if (startDateStr) filter.startDate = new Date(startDateStr);
    if (endDateStr) filter.endDate = new Date(endDateStr);

    const tickets = await this.repo.getTicketsForExport(filter);

    const formatDate = (date?: Date | string) => {
      if (!date) return "N/A";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "N/A";
      return d.toISOString().replace("T", " ").substring(0, 19);
    };

    // Calculate Summary Stats
    const totalCount = tickets.length;
    const openCount = tickets.filter((t) =>
      ["new", "triaged", "in_progress", "awaiting_client_response"].includes(t.status)
    ).length;
    const resolvedCount = tickets.filter((t) =>
      ["resolved", "closed"].includes(t.status)
    ).length;
    const breachedCount = tickets.filter(
      (t) =>
        t.slaFirstResponseStatus === "breached" || t.slaResolutionStatus === "breached"
    ).length;
    const metCount = totalCount - breachedCount;
    const complianceRate = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 100;

    const getStatusStyle = (st: string) => {
      switch (st) {
        case "resolved":
        case "closed":
          return "background-color: #dcfce7; color: #166534; font-weight: bold; border-radius: 4px; padding: 4px 8px;";
        case "in_progress":
        case "triaged":
          return "background-color: #e0e7ff; color: #3730a3; font-weight: bold; border-radius: 4px; padding: 4px 8px;";
        case "awaiting_client_response":
          return "background-color: #fef3c7; color: #92400e; font-weight: bold; border-radius: 4px; padding: 4px 8px;";
        default:
          return "background-color: #dbeafe; color: #1e40af; font-weight: bold; border-radius: 4px; padding: 4px 8px;";
      }
    };

    const getSeverityStyle = (sev: string) => {
      switch (sev) {
        case "critical":
          return "background-color: #ffe4e6; color: #9f1239; font-weight: bold; padding: 4px 8px;";
        case "high":
          return "background-color: #ffedd5; color: #9a3412; font-weight: bold; padding: 4px 8px;";
        case "medium":
          return "background-color: #e0e7ff; color: #3730a3; font-weight: bold; padding: 4px 8px;";
        default:
          return "background-color: #f1f5f9; color: #475569; font-weight: bold; padding: 4px 8px;";
      }
    };

    const getSlaStyle = (sla: string) => {
      switch (sla) {
        case "BREACHED":
          return "background-color: #fecdd3; color: #881337; font-weight: bold; padding: 4px 8px;";
        case "AT RISK":
          return "background-color: #fef3c7; color: #78350f; font-weight: bold; padding: 4px 8px;";
        default:
          return "background-color: #dcfce7; color: #14532d; font-weight: bold; padding: 4px 8px;";
      }
    };

    const rowsHtml = tickets
      .map((t, idx) => {
        const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
        const projectName =
          typeof t.projectId === "object" && (t.projectId as any).name
            ? (t.projectId as any).name
            : "N/A";
        const requesterName =
          typeof t.requesterId === "object" && (t.requesterId as any).name
            ? (t.requesterId as any).name
            : "N/A";
        const requesterEmail =
          typeof t.requesterId === "object" && (t.requesterId as any).email
            ? (t.requesterId as any).email
            : "N/A";
        const assigneeName = t.assigneeId
          ? typeof t.assigneeId === "object" && (t.assigneeId as any).name
            ? (t.assigneeId as any).name
            : "Assigned Staff"
          : "Unassigned";

        const overallSla =
          t.slaResolutionStatus === "breached" || t.slaFirstResponseStatus === "breached"
            ? "BREACHED"
            : t.slaResolutionStatus === "approaching_breach"
            ? "AT RISK"
            : "MET";

        return `
          <tr style="background-color: ${bg}; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #4f46e5;">${t.ticketNumber}</td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${t.title}</td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #334155;">${projectName}</td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #334155;">${t.module}</td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #334155;">${t.issueType}</td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; text-align: center;"><span style="${getSeverityStyle(t.severity)}">${t.severity.toUpperCase()}</span></td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; text-align: center;"><span style="${getStatusStyle(t.status)}">${t.status.replace(/_/g, " ").toUpperCase()}</span></td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #334155;">${requesterName}</td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #64748b; font-size: 11px;">${requesterEmail}</td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #334155;">${assigneeName}</td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #64748b; font-size: 11px;">${formatDate(t.createdAt)}</td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #64748b; font-size: 11px;">${formatDate(t.firstResponseAt)}</td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #64748b; font-size: 11px;">${formatDate(t.resolvedAt)}</td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; text-align: center;"><span style="${getSlaStyle(overallSla)}">${overallSla}</span></td>
          </tr>
        `;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b; }
            .header-banner { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: #ffffff; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
            .header-banner h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 800; tracking-tight; }
            .header-banner p { margin: 0; opacity: 0.9; font-size: 13px; }
            .summary-cards { display: table; width: 100%; margin-bottom: 24px; border-spacing: 12px; }
            .card { display: table-cell; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; text-align: center; }
            .card .val { font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px; }
            .card .lbl { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
            table { width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            th { background-color: #4f46e5; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 12px; border: 1px solid #4338ca; text-align: left; }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <h1>SUPPORT TICKETING PLATFORM - EXECUTIVE REPORT</h1>
            <p>Generated On: ${new Date().toISOString().replace("T", " ").substring(0, 19)} UTC | Requested By: ${user.name} (${user.email})</p>
          </div>

          <table style="width: 100%; margin-bottom: 24px;">
            <tr>
              <td style="padding: 12px; background: #ffffff; border: 1px solid #cbd5e1; text-align: center; border-radius: 8px;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Tickets</div>
                <div style="font-size: 22px; font-weight: 800; color: #0f172a;">${totalCount}</div>
              </td>
              <td style="padding: 12px; background: #ffffff; border: 1px solid #cbd5e1; text-align: center; border-radius: 8px;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Open Tickets</div>
                <div style="font-size: 22px; font-weight: 800; color: #d97706;">${openCount}</div>
              </td>
              <td style="padding: 12px; background: #ffffff; border: 1px solid #cbd5e1; text-align: center; border-radius: 8px;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Resolved Tickets</div>
                <div style="font-size: 22px; font-weight: 800; color: #16a34a;">${resolvedCount}</div>
              </td>
              <td style="padding: 12px; background: #ffffff; border: 1px solid #cbd5e1; text-align: center; border-radius: 8px;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">SLA Compliance</div>
                <div style="font-size: 22px; font-weight: 800; color: ${complianceRate >= 90 ? "#16a34a" : "#dc2626"};">${complianceRate}%</div>
              </td>
            </tr>
          </table>

          <table>
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Title</th>
                <th>Project</th>
                <th>Module</th>
                <th>Issue Type</th>
                <th style="text-align: center;">Severity</th>
                <th style="text-align: center;">Status</th>
                <th>Requester</th>
                <th>Email</th>
                <th>Assignee</th>
                <th>Created Date</th>
                <th>First Response</th>
                <th>Resolved Date</th>
                <th style="text-align: center;">SLA Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;
  }
}

export const reportingService = new ReportingService();
