import { Request, Response, NextFunction } from "express";
import { ticketRepository } from "../repositories/ticket.repository.js";
import { projectMembershipRepository } from "../repositories/project-membership.repository.js";
import { ForbiddenError, UnauthorizedError, BadRequestError, NotFoundError } from "../utils/app-error.js";
import { ProjectRole } from "../models/ProjectMembership.js";

const STAFF_ROLES: ProjectRole[] = [
  "project_admin",
  "project_manager",
  "support_agent",
  "engineer",
];

const MANAGER_ROLES: ProjectRole[] = [
  "project_admin",
  "project_manager",
];

const ADMIN_ROLES: ProjectRole[] = ["project_admin"];

// Helper to construct authorization middleware dynamically for ticket operations
const loadTicketAuthorization = (allowedRoles?: ProjectRole[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      if (req.user.isPlatformAdmin) {
        next();
        return;
      }

      const ticketId = req.params.ticketId || req.params.id;
      if (!ticketId) {
        throw new BadRequestError("Ticket ID parameter is missing");
      }

      const ticket = await ticketRepository.findById(ticketId);
      if (!ticket || ticket.isArchived) {
        throw new NotFoundError("Ticket not found");
      }

      req.ticket = ticket;

      const membership = await projectMembershipRepository.findByUserAndProject(
        req.user._id.toString(),
        ticket.projectId.toString()
      );

      if (!membership) {
        throw new ForbiddenError("You are not a member of this ticket's project");
      }

      req.projectMembership = membership;

      if (allowedRoles && !allowedRoles.includes(membership.role)) {
        throw new ForbiddenError("Insufficient ticket management permissions");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireTicketStaff = loadTicketAuthorization(STAFF_ROLES);
export const requireTicketManager = loadTicketAuthorization(MANAGER_ROLES);
export const requireTicketAdmin = loadTicketAuthorization(ADMIN_ROLES);
