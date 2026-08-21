import { Request, Response, NextFunction } from "express";
import {
  ticketService,
  TicketService,
  CreateTicketDTO,
  UpdateTicketDTO,
} from "../services/ticket.service.js";
import {
  TicketFilters,
  PaginationOptions,
} from "../repositories/ticket.repository.js";
import { TicketStatus } from "../models/Ticket.js";
import { ticketActivityRepository } from "../repositories/ticket-activity.repository.js";
import { projectMembershipRepository } from "../repositories/project-membership.repository.js";
import { s3Service } from "../services/s3.service.js";

export class TicketController {
  constructor(
    private readonly service: TicketService = ticketService
  ) {}

  // POST /api/tickets/upload-url
  getPresignedUploadUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { fileName, fileType, fileSize } = req.body;
      const result = await s3Service.generatePresignedUploadUrl(
        fileName,
        fileType,
        Number(fileSize)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tickets/evidence-url?key=...
  getEvidenceViewUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const key = req.query.key as string;
      if (!key) {
        res.status(400).json({ success: false, message: "S3 object key is required" });
        return;
      }

      const url = await s3Service.generatePresignedGetUrl(key);
      res.status(200).json({
        success: true,
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tickets/evidence-file?key=...
  streamEvidenceFile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const key = req.query.key as string;
      if (!key) {
        res.status(400).json({ success: false, message: "S3 object key is required" });
        return;
      }

      const { stream, contentType, contentLength } = await s3Service.getFileStream(key);

      res.setHeader("Content-Type", contentType);
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }
      res.setHeader("Cache-Control", "public, max-age=3600");

      (stream as any).pipe(res);
    } catch (error) {
      next(error);
    }
  };

  // POST /api/tickets
  createTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!req.user.isEmailVerified) {
        res.status(403).json({
          success: false,
          message: "Email verification is required before raising support tickets. Please verify your email.",
        });
        return;
      }

      const dto: CreateTicketDTO = {
        ...req.body,
        requesterId: req.user._id.toString(),
      };

      const ticket = await this.service.createTicket(dto);

      res.status(201).json({
        success: true,
        message: "Ticket created successfully",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tickets/:ticketId
  getTicketById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const ticket = await this.service.getTicketById(
        req.params.ticketId
      );

      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tickets/number/:ticketNumber
  getTicketByNumber = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const ticket = await this.service.getTicketByNumber(
        req.params.ticketNumber
      );

      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tickets/project/:projectId
  getProjectTickets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const options = this.getPaginationOptions(req);

      const result = await this.service.getProjectTickets(
        req.params.projectId,
        options
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tickets/my
  getMyTickets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const options = this.getPaginationOptions(req);

      const result = await this.service.getRequesterTickets(
        req.user._id.toString(),
        options
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tickets/assignee/:assigneeId
  getAssigneeTickets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const options = this.getPaginationOptions(req);

      const result = await this.service.getAssigneeTickets(
        req.params.assigneeId,
        options
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tickets/search
  searchTickets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters: TicketFilters = {
        projectId: this.getStringQuery(req.query.projectId),
        requesterId: this.getStringQuery(req.query.requesterId),
        assigneeId: this.getStringQuery(req.query.assigneeId),
        status: this.getStringQuery(
          req.query.status
        ) as TicketStatus | undefined,
        severity: this.getStringQuery(req.query.severity) as
          | TicketFilters["severity"]
          | undefined,
        issueType: this.getStringQuery(req.query.issueType),
        module: this.getStringQuery(req.query.module),
        clientOrganisation: this.getStringQuery(
          req.query.clientOrganisation
        ),
        search: this.getStringQuery(req.query.search),
        includeArchived:
          req.query.includeArchived === "true",
        startDate: this.parseDate(req.query.startDate),
        endDate: this.parseDate(req.query.endDate),
      };

      const options = this.getPaginationOptions(req);

      // Scoping logic: client users must only see tickets from projects they belong to with active membership status
      const user = req.user;
      if (user && !user.isPlatformAdmin) {
        const memberships = await projectMembershipRepository.findByUser(user._id.toString());
        const activeMemberships = memberships.filter((m) => m.status === undefined || m.status === "active");
        const userProjectIds = activeMemberships.map((m) =>
          typeof m.projectId === "object" && (m.projectId as any)._id
            ? (m.projectId as any)._id.toString()
            : m.projectId.toString()
        );

        if (user.userType === "client") {
          if (filters.projectId) {
            if (!userProjectIds.includes(filters.projectId)) {
              res.status(200).json({
                success: true,
                data: [],
                pagination: { total: 0, page: 1, limit: options.limit || 20, totalPages: 0 },
              });
              return;
            }
          } else {
            filters.projectIds = userProjectIds;
          }
        }
      }

      const result = await this.service.searchTickets(
        filters,
        options
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // PATCH /api/tickets/:ticketId
  updateTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: UpdateTicketDTO = req.body;
      const actorId = req.user?._id?.toString();

      const ticket = await this.service.updateTicket(
        req.params.ticketId,
        dto,
        actorId
      );

      res.status(200).json({
        success: true,
        message: "Ticket updated successfully",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  // PATCH /api/tickets/:ticketId/status
  updateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { status } = req.body;
      const actorId = req.user?._id?.toString();

      const ticket = await this.service.updateStatus(
        req.params.ticketId,
        status,
        actorId
      );

      res.status(200).json({
        success: true,
        message: "Ticket status updated successfully",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  // PATCH /api/tickets/:ticketId/assign
  assignTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { assigneeId } = req.body;
      const actorId = req.user?._id?.toString();

      const ticket = await this.service.assignTicket(
        req.params.ticketId,
        assigneeId,
        actorId
      );

      res.status(200).json({
        success: true,
        message: "Ticket assigned successfully",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tickets/:ticketId/activity
  getTicketActivities = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      let activities = await ticketActivityRepository.findByTicketId(
        req.params.ticketId
      );

      const isInternalUser = req.user?.isPlatformAdmin || req.user?.userType === "internal";
      if (!isInternalUser) {
        activities = activities.filter((act) => act.action !== "internal_note_added");
      }

      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/tickets/:ticketId
  archiveTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const ticket = await this.service.archiveTicket(
        req.params.ticketId
      );

      res.status(200).json({
        success: true,
        message: "Ticket archived successfully",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  private getPaginationOptions(
    req: Request
  ): PaginationOptions {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const sortBy =
      this.getStringQuery(req.query.sortBy) ||
      "createdAt";

    const sortOrder =
      this.getStringQuery(req.query.sortOrder) === "asc"
        ? "asc"
        : "desc";

    return {
      page,
      limit,
      sortBy,
      sortOrder,
    };
  }

  private getStringQuery(
    value: unknown
  ): string | undefined {
    return typeof value === "string" ? value : undefined;
  }

  private parseDate(
    value: unknown
  ): Date | undefined {
    if (typeof value !== "string") {
      return undefined;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? undefined
      : date;
  }
  getTeamConsoleTickets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const filters: TicketFilters & { preset?: string } = {
        projectId: this.getStringQuery(req.query.projectId),
        requesterId: this.getStringQuery(req.query.requesterId),
        assigneeId: this.getStringQuery(req.query.assigneeId),
        status: this.getStringQuery(req.query.status) as TicketStatus | undefined,
        severity: this.getStringQuery(req.query.severity) as TicketFilters["severity"] | undefined,
        issueType: this.getStringQuery(req.query.issueType),
        module: this.getStringQuery(req.query.module),
        clientOrganisation: this.getStringQuery(req.query.clientOrganisation),
        search: this.getStringQuery(req.query.search),
        preset: this.getStringQuery(req.query.preset),
        startDate: this.parseDate(req.query.startDate),
        endDate: this.parseDate(req.query.endDate),
      };

      const options = this.getPaginationOptions(req);
      const result = await this.service.getTeamConsoleTickets(req.user, filters, options);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  bulkUpdateTickets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const { ticketIds, update } = req.body;
      if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
        res.status(400).json({ success: false, message: "ticketIds array is required" });
        return;
      }

      const result = await this.service.bulkUpdateTickets(ticketIds, update || {}, req.user);

      res.status(200).json({
        success: true,
        message: `Successfully bulk-updated ${result.updatedCount} ticket(s)`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const ticketController = new TicketController();

export const createTicket = ticketController.createTicket;
export const getTeamConsoleTickets = ticketController.getTeamConsoleTickets;
export const bulkUpdateTickets = ticketController.bulkUpdateTickets;

export const getTicketById =
  ticketController.getTicketById;

export const getTicketByNumber =
  ticketController.getTicketByNumber;

export const getProjectTickets =
  ticketController.getProjectTickets;

export const getMyTickets =
  ticketController.getMyTickets;

export const getAssigneeTickets =
  ticketController.getAssigneeTickets;

export const searchTickets =
  ticketController.searchTickets;

export const updateTicket =
  ticketController.updateTicket;

export const updateStatus =
  ticketController.updateStatus;

export const assignTicket =
  ticketController.assignTicket;

export const archiveTicket =
  ticketController.archiveTicket;

export const getTicketActivities =
  ticketController.getTicketActivities;

export const getPresignedUploadUrl =
  ticketController.getPresignedUploadUrl;

export const getEvidenceViewUrl =
  ticketController.getEvidenceViewUrl;

export const streamEvidenceFile =
  ticketController.streamEvidenceFile;