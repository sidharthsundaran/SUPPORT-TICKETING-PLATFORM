import Ticket, { ITicket } from "../models/Ticket.js";

export interface DashboardFilterQuery {
  projectId?: string;
  projectIds?: string[];
  clientOrganisation?: string;
  requesterId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface RawDashboardMetrics {
  kpis: Array<{
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    avgFirstResponseMs: number | null;
    avgResolutionMs: number | null;
  }>;
  bySeverity: Array<{ _id: string; count: number }>;
  byStatus: Array<{ _id: string; count: number }>;
  byModule: Array<{ _id: string; count: number }>;
  byClientOrg: Array<{ _id: string; count: number }>;
  byModuleAndIssueType: Array<{ _id: { module: string; issueType: string }; count: number }>;
  overTime: Array<{ _id: string; created: number; resolved: number }>;
  sla: Array<{
    slaMetCount: number;
    slaBreachedCount: number;
  }>;
  activeBreaches: Array<ITicket>;
}

export class ReportingRepository {
  /**
   * Run single MongoDB $facet aggregation pipeline for dashboard metrics
   */
  async getDashboardMetrics(filter: DashboardFilterQuery): Promise<RawDashboardMetrics> {
    const matchStage: Record<string, any> = { isArchived: false };

    if (filter.projectIds && filter.projectIds.length > 0) {
      matchStage.projectId = { $in: filter.projectIds.map((id) => id) };
    } else if (filter.projectId) {
      matchStage.projectId = filter.projectId;
    }

    if (filter.clientOrganisation) {
      matchStage.clientOrganisation = filter.clientOrganisation;
    }

    if (filter.requesterId) {
      matchStage.requesterId = filter.requesterId;
    }

    if (filter.startDate || filter.endDate) {
      matchStage.createdAt = {};
      if (filter.startDate) matchStage.createdAt.$gte = filter.startDate;
      if (filter.endDate) matchStage.createdAt.$lte = filter.endDate;
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $facet: {
          kpis: [
            {
              $group: {
                _id: null,
                totalTickets: { $sum: 1 },
                openTickets: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$status",
                          ["new", "triaged", "in_progress", "awaiting_client_response"],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                resolvedTickets: {
                  $sum: {
                    $cond: [
                      { $in: ["$status", ["resolved", "closed"]] },
                      1,
                      0,
                    ],
                  },
                },
                avgFirstResponseMs: {
                  $avg: {
                    $cond: [
                      { $and: [{ $ne: ["$firstResponseAt", null] }] },
                      { $subtract: ["$firstResponseAt", "$createdAt"] },
                      null,
                    ],
                  },
                },
                avgResolutionMs: {
                  $avg: {
                    $cond: [
                      { $and: [{ $ne: ["$resolvedAt", null] }] },
                      {
                        $subtract: [
                          { $subtract: ["$resolvedAt", "$createdAt"] },
                          { $ifNull: ["$slaClock.totalPausedMs", 0] },
                        ],
                      },
                      null,
                    ],
                  },
                },
              },
            },
          ],
          bySeverity: [
            { $group: { _id: "$severity", count: { $sum: 1 } } },
          ],
          byStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          byModule: [
            { $group: { _id: "$module", count: { $sum: 1 } } },
          ],
          byClientOrg: [
            { $group: { _id: "$clientOrganisation", count: { $sum: 1 } } },
          ],
          byModuleAndIssueType: [
            {
              $group: {
                _id: { module: "$module", issueType: "$issueType" },
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
          overTime: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                created: { $sum: 1 },
                resolved: {
                  $sum: {
                    $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0],
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
            { $limit: 30 },
          ],
          sla: [
            {
              $group: {
                _id: null,
                slaMetCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ["$slaFirstResponseStatus", "breached"] },
                          { $ne: ["$slaResolutionStatus", "breached"] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                slaBreachedCount: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          { $eq: ["$slaFirstResponseStatus", "breached"] },
                          { $eq: ["$slaResolutionStatus", "breached"] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          activeBreaches: [
            {
              $match: {
                status: { $nin: ["resolved", "closed", "rejected", "duplicate"] },
                $or: [
                  { slaFirstResponseStatus: "breached" },
                  { slaResolutionStatus: "breached" },
                  { slaResolutionStatus: "approaching_breach" },
                ],
              },
            },
            { $sort: { slaResolutionDueAt: 1 } },
            { $limit: 10 },
          ],
        },
      },
    ];

    const result = await Ticket.aggregate(pipeline).exec();
    const data = result[0] || {};

    return {
      kpis: data.kpis || [],
      bySeverity: data.bySeverity || [],
      byStatus: data.byStatus || [],
      byModule: data.byModule || [],
      byClientOrg: data.byClientOrg || [],
      byModuleAndIssueType: data.byModuleAndIssueType || [],
      overTime: data.overTime || [],
      sla: data.sla || [],
      activeBreaches: data.activeBreaches || [],
    };
  }

  /**
   * Fetch tickets matching filters for CSV Export streaming
   */
  async getTicketsForExport(filter: DashboardFilterQuery): Promise<ITicket[]> {
    const matchStage: Record<string, any> = { isArchived: false };

    if (filter.projectIds && filter.projectIds.length > 0) {
      matchStage.projectId = { $in: filter.projectIds };
    } else if (filter.projectId) {
      matchStage.projectId = filter.projectId;
    }

    if (filter.clientOrganisation) {
      matchStage.clientOrganisation = filter.clientOrganisation;
    }

    if (filter.requesterId) {
      matchStage.requesterId = filter.requesterId;
    }

    if (filter.startDate || filter.endDate) {
      matchStage.createdAt = {};
      if (filter.startDate) matchStage.createdAt.$gte = filter.startDate;
      if (filter.endDate) matchStage.createdAt.$lte = filter.endDate;
    }

    return Ticket.find(matchStage)
      .populate("projectId", "name code")
      .populate("requesterId", "name email")
      .populate("assigneeId", "name email")
      .sort({ createdAt: -1 })
      .exec();
  }
}

export const reportingRepository = new ReportingRepository();
