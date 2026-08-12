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
  categoryRepository,
  CategoryRepository,
} from "../repositories/category.repository.js";

import { ITicket, TicketSeverity, TicketStatus } from "../models/Ticket.js";

export interface CreateTicketDTO {
  projectId: string;
  categoryId: string;
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
  sessionContext?: {
    browser?: string;
    os?: string;
    device?: string;
    timezone?: string;
  };
}

export interface UpdateTicketDTO {
  categoryId?: string;
  title?: string;
  description?: string;
  issueType?: string;
  module?: string;
  severity?: TicketSeverity;
  environment?: string;
  applicationUrl?: string;
  pageUrl?: string;
}

export class TicketService {
  constructor(
    private readonly ticketRepo: TicketRepository = ticketRepository,
    private readonly projectRepo: ProjectRepository = projectRepository,
    private readonly membershipRepo: ProjectMembershipRepository =
      projectMembershipRepository,
    private readonly categoryRepo: CategoryRepository = categoryRepository
  ) {}

  async createTicket(dto: CreateTicketDTO): Promise<ITicket> {
    this.validateCreateTicket(dto);

    // Perform validation queries and ticket number generation concurrently
    const [project, membership, category, ticketNumber] = await Promise.all([
      this.projectRepo.findById(dto.projectId),
      this.membershipRepo.findByUserAndProject(dto.requesterId, dto.projectId),
      this.categoryRepo.findById(dto.categoryId),
      this.generateTicketNumber(),
    ]);

    // 1. Validate project existence and active status
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (!project.isActive) {
      throw new BadRequestError("Cannot create ticket in an inactive project");
    }

    // 2. Validate requester membership
    if (!membership) {
      throw new BadRequestError("Requester is not a member of this project");
    }

    // 3. Validate category existence, project association, and active status
    if (!category) {
      throw new NotFoundError("Category not found");
    }

    if (category.projectId.toString() !== dto.projectId) {
      throw new BadRequestError("Category does not belong to this project");
    }

    if (!category.isActive) {
      throw new BadRequestError("Category is inactive");
    }

    // 4. Build sanitized data payload
    const ticketData: CreateTicketData = {
      ticketNumber,
      projectId: dto.projectId,
      categoryId: dto.categoryId,
      requesterId: dto.requesterId,
      clientOrganisation: dto.clientOrganisation?.trim(),
      title: dto.title.trim(),
      description: dto.description.trim(),
      issueType: dto.issueType.trim(),
      module: dto.module.trim(),
      severity: dto.severity ?? "medium",
      environment: dto.environment.trim(),
      applicationUrl: dto.applicationUrl?.trim(),
      pageUrl: dto.pageUrl?.trim(),
      sessionContext: dto.sessionContext,
    };

    return this.ticketRepo.create(ticketData);
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
    assigneeId: string
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

    return updated;
  }

  async updateStatus(
    ticketId: string,
    status: TicketStatus
  ): Promise<ITicket> {
    const ticket = await this.getRawTicketById(ticketId);

    const updateData: Partial<ITicket> = { status };

    if (
      !ticket.firstResponseAt &&
      ["in_progress", "awaiting_client_response", "resolved"].includes(status)
    ) {
      updateData.firstResponseAt = new Date();
    }

    if (status === "resolved") {
      updateData.resolvedAt = new Date();
    } else if (status === "closed") {
      updateData.closedAt = new Date();
    } else if (status === "reopened") {
      updateData.resolvedAt = undefined;
      updateData.closedAt = undefined;
    }

    const updated = await this.ticketRepo.updateById(
      ticketId,
      updateData
    );

    if (!updated) {
      throw new NotFoundError("Ticket not found");
    }

    return updated;
  }

  async updateTicket(
    ticketId: string,
    dto: UpdateTicketDTO
  ): Promise<ITicket> {
    const [ticket, category] = await Promise.all([
      this.getRawTicketById(ticketId),
      dto.categoryId
        ? this.categoryRepo.findById(dto.categoryId)
        : Promise.resolve(null),
    ]);

    const updateData: Partial<ITicket> = {};

    if (dto.categoryId) {
      if (!category) {
        throw new NotFoundError("Category not found");
      }

      if (category.projectId.toString() !== ticket.projectId.toString()) {
        throw new BadRequestError("Category does not belong to this project");
      }

      if (!category.isActive) {
        throw new BadRequestError("Category is inactive");
      }

      updateData.categoryId = category._id;
    }

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

    return updated;
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

    if (!project.isActive) {
      throw new BadRequestError("Project is inactive");
    }

    return project;
  }

  private validateCreateTicket(dto: CreateTicketDTO): void {
    if (!dto.projectId) {
      throw new BadRequestError("projectId is required");
    }

    if (!dto.categoryId) {
      throw new BadRequestError("categoryId is required");
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

  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const key = `ticket:seq:${year}`;

    try {
      const exists = await redisConnection.exists(key);
      if (!exists) {
        const count = await this.ticketRepo.countByYear(year);
        await redisConnection.setnx(key, count);
      }

      const seq = await redisConnection.incr(key);
      const sequence = String(seq).padStart(6, "0");

      return `TKT-${year}-${sequence}`;
    } catch (error) {
      console.error("Redis sequence generator error, falling back to DB count:", error);
      const count = await this.ticketRepo.countByYear(year);
      const sequence = String(count + 1).padStart(6, "0");

      return `TKT-${year}-${sequence}`;
    }
  }
}

export const ticketService = new TicketService();
