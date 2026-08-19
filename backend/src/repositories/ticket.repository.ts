import Ticket, {
  ITicket,
  TicketStatus,
  TicketSeverity,
  ITicketEvidenceFile,
} from "../models/Ticket.js";

export interface CreateTicketData {
  ticketNumber: string;
  projectId: string;
  requesterId: string;
  clientOrganisation?: string;

  title: string;
  description: string;

  issueType: string;
  module: string;
  severity: TicketSeverity;
  environment: string;

  applicationUrl?: string;
  pageUrl?: string;
  evidenceFiles?: ITicketEvidenceFile[];

  sessionContext?: {
    browser?: string;
    os?: string;
    device?: string;
    timezone?: string;
  };

  slaFirstResponseDueAt?: Date;
  slaResolutionDueAt?: Date;
  slaFirstResponseStatus?: "pending" | "met" | "breached";
  slaResolutionStatus?: "within_sla" | "approaching_breach" | "breached";
}

export interface TicketFilters {
  projectId?: string;
  projectIds?: string[];
  requesterId?: string;
  assigneeId?: string;
  status?: TicketStatus;
  severity?: TicketSeverity;
  issueType?: string;
  module?: string;
  clientOrganisation?: string;
  search?: string;
  includeArchived?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class TicketRepository {
  async create(data: CreateTicketData): Promise<ITicket> {
    return Ticket.create(data);
  }

  async findById(ticketId: string): Promise<ITicket | null> {
    return Ticket.findById(ticketId);
  }

  async findByTicketNumber(
    ticketNumber: string
  ): Promise<ITicket | null> {
    return Ticket.findOne({ ticketNumber, isArchived: false });
  }

  async findByIdWithDetails(
    ticketId: string
  ): Promise<ITicket | null> {
    return Ticket.findById(ticketId)
      .populate("projectId", "name")
      .populate("requesterId", "name email userType")
      .populate("assigneeId", "name email");
  }

  async findByProject(
    projectId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<ITicket>> {
    return this.find({ projectId }, options);
  }

  async findByRequester(
    requesterId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<ITicket>> {
    return this.find({ requesterId }, options);
  }

  async find(
    filters: TicketFilters = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<ITicket>> {
    const {
      projectId,
      projectIds,
      requesterId,
      assigneeId,
      status,
      severity,
      issueType,
      module,
      clientOrganisation,
      search,
      includeArchived = false,
      startDate,
      endDate,
    } = filters;

    const query: Record<string, any> = {};

    if (!includeArchived) {
      query.isArchived = false;
    }

    if (projectIds && projectIds.length > 0) {
      query.projectId = { $in: projectIds };
    } else if (projectId) {
      query.projectId = projectId;
    }
    if (requesterId) query.requesterId = requesterId;
    if (assigneeId) query.assigneeId = assigneeId;
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (issueType) query.issueType = issueType;
    if (module) query.module = module;
    if (clientOrganisation) query.clientOrganisation = clientOrganisation;

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { ticketNumber: searchRegex },
        { description: searchRegex },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      Ticket.find(query)
        .populate("projectId", "name code")
        .populate("requesterId", "name email")
        .populate("assigneeId", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      Ticket.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async updateById(
    ticketId: string,
    updateData: Partial<ITicket>
  ): Promise<ITicket | null> {
    return Ticket.findByIdAndUpdate(ticketId, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async updateStatus(
    ticketId: string,
    status: TicketStatus
  ): Promise<ITicket | null> {
    const updateData: Partial<ITicket> = { status };

    if (status === "resolved") {
      updateData.resolvedAt = new Date();
    } else if (status === "closed") {
      updateData.closedAt = new Date();
    }

    return Ticket.findByIdAndUpdate(ticketId, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async recordFirstResponse(ticketId: string): Promise<ITicket | null> {
    return Ticket.findOneAndUpdate(
      { _id: ticketId, firstResponseAt: { $exists: false } },
      { firstResponseAt: new Date() },
      { new: true }
    );
  }

  async assign(
    ticketId: string,
    assigneeId: string
  ): Promise<ITicket | null> {
    return Ticket.findByIdAndUpdate(
      ticketId,
      { assigneeId },
      {
        new: true,
        runValidators: true,
      }
    );
  }

  async archive(ticketId: string): Promise<ITicket | null> {
    return Ticket.findByIdAndUpdate(
      ticketId,
      {
        isArchived: true,
        deletedAt: new Date(),
      },
      {
        new: true,
      }
    );
  }

  async findByAssignee(
    assigneeId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<ITicket>> {
    return this.find({ assigneeId }, options);
  }

  async countByYear(year: number): Promise<number> {
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    return Ticket.countDocuments({
      createdAt: {
        $gte: start,
        $lt: end,
      },
    });
  }
}

export const ticketRepository = new TicketRepository();
