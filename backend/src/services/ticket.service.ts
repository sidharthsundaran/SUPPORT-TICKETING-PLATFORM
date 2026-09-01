import {
  BadRequestError,
  NotFoundError,
} from "../utils/app-error.js";

import redisConnection from "../config/redis.js";

import {
  ticketRepository,
  TicketRepository,
  CreateTicketData,
  TicketFilters,
  PaginationOptions,
  PaginatedResult,
} from "../repositories/ticket.repository.js";

import {
  projectRepository,
  ProjectRepository,
} from "../repositories/project.repository.js";

import {
  projectMembershipRepository,
  ProjectMembershipRepository,
} from "../repositories/project-membership.repository.js";

import {
  userRepository,
  UserRepository,
} from "../repositories/user.repository.js";

import {
  ticketActivityRepository,
  TicketActivityRepository,
} from "../repositories/ticket-activity.repository.js";

import { ITicket, TicketStatus, TicketSeverity, ITicketEvidenceFile } from "../models/Ticket.js";
import { s3Service, S3Service } from "./s3.service.js";
import {
  calculateFirstResponseDueAt,
  calculateResolutionDueAt,
} from "../utils/sla.calculator.js";
import { notificationService, NotificationService } from "./notification.service.js";
import AuditLog from "../models/AuditLog.js";

export interface CreateTicketDTO {
  projectId: string;
  requesterId: string;
  title: string;
  description: string;
  issueType: string;
  module: string;
  severity?: TicketSeverity;
  environment: string;
  applicationUrl?: string;
  pageUrl?: string;
  clientOrganisation?: string;
  evidenceFiles?: ITicketEvidenceFile[];
  sessionContext?: {
    browser?: string;
    os?: string;
    device?: string;
    timezone?: string;
  };
}

export interface UpdateTicketDTO {
  title?: string;
  description?: string;
  issueType?: string;
  module?: string;
  severity?: TicketSeverity;
  environment?: string;
  applicationUrl?: string;
  pageUrl?: string;
  retainedEvidenceKeys?: string[];
  newEvidenceFiles?: ITicketEvidenceFile[];
}

export class TicketService {
  constructor(
    private readonly ticketRepo: TicketRepository = ticketRepository,
    private readonly projectRepo: ProjectRepository = projectRepository,
    private readonly membershipRepo: ProjectMembershipRepository =
      projectMembershipRepository,
    private readonly userRepo: UserRepository = userRepository,
    private readonly activityRepo: TicketActivityRepository = ticketActivityRepository,
    private readonly s3Svc: S3Service = s3Service
  ) { }

  async createTicket(dto: CreateTicketDTO): Promise<ITicket> {
    this.validateCreateTicket(dto);

    // 1. Fetch Project, Membership, and Requester concurrently
    const [project, membership, requesterUser] = await Promise.all([
      this.projectRepo.findById(dto.projectId),
      this.membershipRepo.findByUserAndProject(dto.requesterId, dto.projectId),
      this.userRepo.findById(dto.requesterId),
    ]);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (project.status === "inactive" || project.isActive === false) {
      throw new BadRequestError("Cannot create ticket in an inactive project");
    }

    if (!membership && !requesterUser?.isPlatformAdmin) {
      throw new BadRequestError("Requester is not a member of this project");
    }

    // 3. Validate Issue Type against Project's configured list
    if (project.issueTypes && project.issueTypes.length > 0) {
      const validIssueType = project.issueTypes.some(
        (it) => it.name.toLowerCase() === dto.issueType.trim().toLowerCase() && it.isActive
      );
      if (!validIssueType) {
        throw new BadRequestError("Invalid or inactive Issue Type for this project");
      }
    }

    // 4. Validate Module against Project's configured list
    if (project.modules && project.modules.length > 0) {
      const validModule = project.modules.some(
        (m) => m.name.toLowerCase() === dto.module.trim().toLowerCase() && m.isActive
      );
      if (!validModule) {
        throw new BadRequestError("Invalid or inactive Product Module for this project");
      }
    }

    const ticketNumber = await this.generateTicketNumber(project.code || "TKT");

    const now = new Date();
    const severity = dto.severity ?? "medium";
    const slaFirstResponseDueAt = calculateFirstResponseDueAt(
      now,
      severity,
      (project as any).slaMatrix
    );
    const slaResolutionDueAt = calculateResolutionDueAt(
      now,
      severity,
      (project as any).slaMatrix
    );

    // 7. Build sanitized data payload
    const ticketData: CreateTicketData = {
      ticketNumber,
      projectId: dto.projectId,
      requesterId: dto.requesterId,
      clientOrganisation: dto.clientOrganisation?.trim(),
      title: dto.title.trim(),
      description: dto.description.trim(),
      issueType: dto.issueType.trim(),
      module: dto.module.trim(),
      severity,
      environment: dto.environment.trim(),
      applicationUrl: dto.applicationUrl?.trim(),
      pageUrl: dto.pageUrl?.trim(),
      evidenceFiles: dto.evidenceFiles || [],
      sessionContext: dto.sessionContext,
      slaFirstResponseDueAt,
      slaResolutionDueAt,
      slaFirstResponseStatus: "pending",
      slaResolutionStatus: "within_sla",
    };

    const createdTicket = await this.ticketRepo.create(ticketData);

    await this.activityRepo.create({
      ticketId: createdTicket._id.toString(),
      actorId: dto.requesterId,
      action: "created",
      newValue: createdTicket.title,
    });

    await notificationService.dispatchNewTicketNotifications(createdTicket);

    return createdTicket;
  }

  async getTicketById(ticketId: string): Promise<ITicket> {
    const ticket = await this.ticketRepo.findByIdWithDetails(ticketId);

    if (!ticket) {
      throw new NotFoundError("Ticket not found");
    }

    return ticket;
  }

  async getTicketByNumber(ticketNumber: string): Promise<ITicket> {
    const ticket =
      await this.ticketRepo.findByTicketNumber(ticketNumber);

    if (!ticket) {
      throw new NotFoundError("Ticket not found");
    }

    return ticket;
  }

  async getProjectTickets(
    projectId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<ITicket>> {
    await this.validateProject(projectId);

    return this.ticketRepo.findByProject(projectId, options);
  }

  async getRequesterTickets(
    requesterId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<ITicket>> {
    return this.ticketRepo.findByRequester(requesterId, options);
  }

  async getAssigneeTickets(
    assigneeId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<ITicket>> {
    return this.ticketRepo.findByAssignee(assigneeId, options);
  }

  async searchTickets(
    filters: TicketFilters,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<ITicket>> {
    if (filters.projectId) {
      await this.validateProject(filters.projectId);
    }

    return this.ticketRepo.find(filters, options);
  }

  async assignTicket(
    ticketId: string,
    assigneeId: string,
    actorId?: string
  ): Promise<ITicket> {
    const ticket = await this.getRawTicketById(ticketId);

    const membership =
      await this.membershipRepo.findByUserAndProject(
        assigneeId,
        ticket.projectId.toString()
      );

    if (!membership) {
      throw new BadRequestError(
        "Assignee is not a member of this project"
      );
    }

    const assignableRoles = [
      "project_admin",
      "project_manager",
      "support_agent",
      "engineer",
    ];

    if (!assignableRoles.includes(membership.role)) {
      throw new BadRequestError(
        "User role cannot be assigned to tickets"
      );
    }

    const updated = await this.ticketRepo.assign(
      ticketId,
      assigneeId
    );

    if (!updated) {
      throw new NotFoundError("Ticket not found");
    }

    if (actorId) {
      await this.activityRepo.create({
        ticketId,
        actorId,
        action: "assignee_changed",
        oldValue: ticket.assigneeId?.toString() || "Unassigned",
        newValue: assigneeId,
      });
    }

    await notificationService.dispatchAssignmentNotification(updated, assigneeId, actorId);

    return updated;
  }

  async updateStatus(
    ticketId: string,
    status: TicketStatus,
    actorId?: string
  ): Promise<ITicket> {
    const ticket = await this.getRawTicketById(ticketId);

    const updateData: Partial<ITicket> = { status };

    const now = new Date();

    // 1. First Response Stop
    if (
      (!ticket.firstResponseAt || ticket.slaFirstResponseStatus === "pending") &&
      ["triaged", "in_progress", "awaiting_client_response", "resolved"].includes(status)
    ) {
      updateData.firstResponseAt = now;
      const dueAt = ticket.slaFirstResponseDueAt ? new Date(ticket.slaFirstResponseDueAt) : null;
      updateData.slaFirstResponseStatus = dueAt && now <= dueAt ? "met" : "breached";
    }

    // 2. BR-WFL-003: SLA Pause on awaiting_client_response
    if (status === "awaiting_client_response") {
      updateData.slaClock = {
        pausedAt: now,
        totalPausedMs: ticket.slaClock?.totalPausedMs || 0,
      };
    } else if (ticket.status === "awaiting_client_response" && ticket.slaClock?.pausedAt) {
      const pauseDuration = now.getTime() - new Date(ticket.slaClock.pausedAt).getTime();
      const newTotalPausedMs = (ticket.slaClock.totalPausedMs || 0) + pauseDuration;

      updateData.slaClock = {
        pausedAt: undefined,
        totalPausedMs: newTotalPausedMs,
      };

      if (ticket.slaResolutionDueAt) {
        updateData.slaResolutionDueAt = new Date(
          new Date(ticket.slaResolutionDueAt).getTime() + pauseDuration
        );
      }
    }

    // 3. Resolution Stop
    if (status === "resolved") {
      updateData.resolvedAt = now;
      const dueAt = updateData.slaResolutionDueAt || (ticket.slaResolutionDueAt ? new Date(ticket.slaResolutionDueAt) : null);
      updateData.slaResolutionStatus = dueAt && now <= dueAt ? "within_sla" : "breached";
    } else if (status === "closed") {
      updateData.closedAt = now;
    } else if (status === "reopened") {
      updateData.resolvedAt = undefined;
      updateData.closedAt = undefined;
      if (ticket.slaResolutionDueAt && now > new Date(ticket.slaResolutionDueAt)) {
        updateData.slaResolutionStatus = "breached";
      }
    }

    const updated = await this.ticketRepo.updateById(
      ticketId,
      updateData
    );

    if (!updated) {
      throw new NotFoundError("Ticket not found");
    }

    if (actorId && ticket.status !== status) {
      await this.activityRepo.create({
        ticketId,
        actorId,
        action: "status_changed",
        oldValue: ticket.status,
        newValue: status,
      });

      // Dispatch Status Change Notification (BR-NTF-004, BR-NTF-009)
      await notificationService.dispatchStatusChangeNotification(
        updated,
        ticket.status,
        status,
        actorId
      );
    }

    return updated;
  }

  async updateTicket(
    ticketId: string,
    dto: UpdateTicketDTO,
    actorId?: string
  ): Promise<ITicket> {
    const ticket = await this.getRawTicketById(ticketId);
    const updateData: Partial<ITicket> = {};

    if (dto.title !== undefined) {
      const title = dto.title.trim();
      if (title.length < 3 || title.length > 200) {
        throw new BadRequestError(
          "Title must be between 3 and 200 characters long"
        );
      }
      updateData.title = title;
    }

    if (dto.description !== undefined) {
      const description = dto.description.trim();
      if (!description) {
        throw new BadRequestError("Description cannot be empty");
      }
      updateData.description = description;
    }

    if (dto.issueType !== undefined) {
      updateData.issueType = dto.issueType.trim();
    }

    if (dto.module !== undefined) {
      updateData.module = dto.module.trim();
    }

    if (dto.severity !== undefined) {
      updateData.severity = dto.severity;
    }

    if (dto.environment !== undefined) {
      updateData.environment = dto.environment.trim();
    }

    if (dto.applicationUrl !== undefined) {
      updateData.applicationUrl = dto.applicationUrl.trim();
    }

    if (dto.pageUrl !== undefined) {
      updateData.pageUrl = dto.pageUrl.trim();
    }

    if (dto.retainedEvidenceKeys !== undefined || dto.newEvidenceFiles !== undefined) {
      const currentEvidence = ticket.evidenceFiles || [];
      const retainedKeys = dto.retainedEvidenceKeys || currentEvidence.map((f) => f.key);

      const removedFiles = currentEvidence.filter((f) => !retainedKeys.includes(f.key));
      const keptFiles = currentEvidence.filter((f) => retainedKeys.includes(f.key));
      const newFiles = dto.newEvidenceFiles || [];

      for (const removed of removedFiles) {
        await this.s3Svc.deleteFileFromS3(removed.key);
        if (actorId) {
          await this.activityRepo.create({
            ticketId,
            actorId,
            action: "evidence_removed",
            newValue: removed.originalName,
          });
        }
      }

      if (newFiles.length > 0 && actorId) {
        for (const nf of newFiles) {
          await this.activityRepo.create({
            ticketId,
            actorId,
            action: "evidence_added",
            newValue: nf.originalName,
          });
        }
      }

      updateData.evidenceFiles = [...keptFiles, ...newFiles];
    }

    if (Object.keys(updateData).length === 0) {
      return ticket;
    }

    const updated = await this.ticketRepo.updateById(
      ticketId,
      updateData
    );

    if (!updated) {
      throw new NotFoundError("Ticket not found");
    }

    if (actorId) {
      if (dto.severity && dto.severity !== ticket.severity) {
        await this.activityRepo.create({
          ticketId,
          actorId,
          action: "severity_changed",
          oldValue: ticket.severity,
          newValue: dto.severity,
        });
      }

      await this.activityRepo.create({
        ticketId,
        actorId,
        action: "details_updated",
        metadata: updateData,
      });
    }

    return updated;
  }

  async submitSatisfactionRating(
    ticketId: string,
    rating: number,
    comment?: string,
    user?: any
  ): Promise<ITicket> {
    const ticket = await this.getRawTicketById(ticketId);

    if (ticket.status !== "resolved" && ticket.status !== "closed") {
      throw new BadRequestError("Satisfaction rating can only be submitted for resolved or closed tickets.");
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestError("Rating must be between 1 and 5.");
    }

    ticket.satisfactionRating = {
      rating,
      comment: comment?.trim(),
      ratedAt: new Date(),
    };

    await ticket.save();

    await this.activityRepo.create({
      ticketId: ticket._id.toString(),
      actorId: user?._id?.toString() || ticket.requesterId.toString(),
      action: "details_updated",
      metadata: { satisfactionRating: ticket.satisfactionRating },
    });

    return ticket;
  }

  async archiveTicket(ticketId: string): Promise<ITicket> {
    await this.getRawTicketById(ticketId);

    const updated = await this.ticketRepo.archive(ticketId);

    if (!updated) {
      throw new NotFoundError("Ticket not found");
    }

    return updated;
  }

  private async getRawTicketById(ticketId: string): Promise<ITicket> {
    const ticket = await this.ticketRepo.findById(ticketId);

    if (!ticket || ticket.isArchived) {
      throw new NotFoundError("Ticket not found");
    }

    return ticket;
  }

  private async validateProject(projectId: string) {
    const project = await this.projectRepo.findById(projectId);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (project.status === "inactive" || project.isActive === false) {
      throw new BadRequestError("Project is inactive");
    }

    return project;
  }

  private validateCreateTicket(dto: CreateTicketDTO): void {
    if (!dto.projectId) {
      throw new BadRequestError("projectId is required");
    }

    if (!dto.requesterId) {
      throw new BadRequestError("requesterId is required");
    }

    const title = dto.title?.trim();
    if (!title || title.length < 3 || title.length > 200) {
      throw new BadRequestError(
        "Ticket title must be between 3 and 200 characters long"
      );
    }

    if (!dto.description?.trim()) {
      throw new BadRequestError("Ticket description is required");
    }

    if (!dto.issueType?.trim()) {
      throw new BadRequestError("issueType is required");
    }

    if (!dto.module?.trim()) {
      throw new BadRequestError("module is required");
    }

    if (!dto.environment?.trim()) {
      throw new BadRequestError("environment is required");
    }
  }

  // BR-TKT-005: Format <PROJECTCODE>-<YYYYMM>-<SEQ> (e.g. RB-202608-0042)
  private async generateTicketNumber(projectCode: string): Promise<string> {
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const code = projectCode.toUpperCase().trim();
    const key = `ticket:seq:${code}:${yyyymm}`;

    try {
      const seq = await redisConnection.incr(key);
      if (seq === 1) {
        await redisConnection.expire(key, 60 * 60 * 24 * 40);
      }
      const sequence = String(seq).padStart(4, "0");
      return `${code}-${yyyymm}-${sequence}`;
    } catch (error) {
      console.error("Redis sequence generator error, falling back to DB count:", error);
      const count = await this.ticketRepo.countByYear(now.getFullYear());
      const sequence = String(count + 1).padStart(4, "0");
      return `${code}-${yyyymm}-${sequence}`;
    }
  }

  async getTeamConsoleTickets(
    user: any,
    filters: TicketFilters & { preset?: string },
    options: PaginationOptions = {}
  ) {
    let userProjectIds: string[] = [];

    if (!user.isPlatformAdmin) {
      const memberships = await this.membershipRepo.findByUser(user._id.toString());
      const activeMemberships = memberships.filter((m) => m.status === undefined || m.status === "active");
      userProjectIds = activeMemberships.map((m) =>
        typeof m.projectId === "object" && (m.projectId as any)._id
          ? (m.projectId as any)._id.toString()
          : m.projectId.toString()
      );
    } else {
      const projects = await this.projectRepo.findActive();
      userProjectIds = projects.map((p: any) => p._id.toString());
    }

    const searchFilters: TicketFilters = { ...filters };

    if (filters.projectId) {
      if (!user.isPlatformAdmin && !userProjectIds.includes(filters.projectId)) {
        return { data: [], total: 0, page: options.page || 1, limit: options.limit || 20, totalPages: 0 };
      }
    } else {
      searchFilters.projectIds = userProjectIds;
    }

    // Apply Preset Views Filter Logic
    if (filters.preset === "unassigned") {
      searchFilters.assigneeId = "unassigned";
    } else if (filters.preset === "my_open") {
      searchFilters.assigneeId = user._id.toString();
    } else if (filters.preset === "critical_high") {
      searchFilters.severity = "critical";
    }

    const result = await this.ticketRepo.find(searchFilters, options);

    const { calculateTicketSlaInfo } = await import("../utils/sla.calculator.js");

    const enrichedData = result.data.map((ticket: any) => {
      const sla = calculateTicketSlaInfo(ticket);
      return {
        ...ticket.toObject(),
        sla,
      };
    });

    return {
      ...result,
      data: enrichedData,
    };
  }

  async bulkUpdateTickets(
    ticketIds: string[],
    update: { assigneeId?: string | null; status?: TicketStatus; tags?: string[] },
    actor: any
  ): Promise<{ updatedCount: number }> {
    if (!ticketIds || ticketIds.length === 0) {
      throw new BadRequestError("At least one ticketId must be specified for bulk update");
    }

    let updatedCount = 0;

    for (const ticketId of ticketIds) {
      const ticket = await this.ticketRepo.findById(ticketId);
      if (!ticket) continue;

      let hasChanges = false;

      if (update.assigneeId !== undefined) {
        if (update.assigneeId === null) {
          (ticket as any).assigneeId = undefined;
        } else {
          ticket.assigneeId = update.assigneeId as any;
        }
        hasChanges = true;
      }

      if (update.status && update.status !== ticket.status) {
        ticket.status = update.status;
        hasChanges = true;
      }

      if (update.tags && Array.isArray(update.tags)) {
        ticket.tags = Array.from(new Set([...(ticket.tags || []), ...update.tags]));
        hasChanges = true;
      }

      if (hasChanges) {
        await ticket.save();
        updatedCount++;

        await this.activityRepo.create({
          ticketId: ticket._id.toString(),
          actorId: actor._id.toString(),
          action: "details_updated",
          metadata: update,
        });

        await AuditLog.create({
          action: "BULK_TICKET_UPDATE",
          actorId: actor._id,
          targetId: ticket._id,
          details: update,
        });
      }
    }

    return { updatedCount };
  }
}

export const ticketService = new TicketService();
