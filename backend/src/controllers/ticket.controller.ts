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

export class TicketController {
  constructor(
    private readonly service: TicketService = ticketService
  ) {}

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
        categoryId: this.getStringQuery(req.query.categoryId),
        status: this.getStringQuery(
          req.query.status
        ) as TicketStatus | undefined,
        severity: this.getStringQuery(req.query.severity) as
          | TicketFilters["severity"]
          | undefined,
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

      const ticket = await this.service.updateTicket(
        req.params.ticketId,
        dto
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

      const ticket = await this.service.updateStatus(
        req.params.ticketId,
        status
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

      const ticket = await this.service.assignTicket(
        req.params.ticketId,
        assigneeId
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
}

export const ticketController = new TicketController();

export const createTicket =
  ticketController.createTicket;

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