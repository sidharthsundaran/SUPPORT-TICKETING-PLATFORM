import { Request, Response, NextFunction } from "express";
import { projectMembershipRepository } from "../repositories/project-membership.repository.js";
import { ForbiddenError, UnauthorizedError, BadRequestError } from "../utils/app-error.js";
import { ProjectRole } from "../models/ProjectMembership.js";

const PROJECT_ADMIN_ROLES: ProjectRole[] = ["project_admin"];
const PROJECT_MANAGER_ROLES: ProjectRole[] = ["project_admin", "project_manager"];
const STAFF_ROLES: ProjectRole[] = [
  "project_admin",
  "project_manager",
  "support_agent",
  "engineer",
];

// Helper to construct authorization middleware dynamically
const authorizeProjectRole = (allowedRoles?: ProjectRole[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      if (req.user.isPlatformAdmin) {
        next();
        return;
      }

      // Reuse existing membership if a previous middleware attached it
      let membership = req.projectMembership;

      if (!membership) {
        const projectId = req.params.projectId || req.params.id;

        if (!projectId) {
          throw new BadRequestError("Project ID parameter is missing");
        }

        membership = await projectMembershipRepository.findByUserAndProject(
          req.user._id.toString(),
          projectId
        );

        if (!membership) {
          throw new ForbiddenError("You are not a member of this project");
        }

        req.projectMembership = membership;
      }

      // If allowedRoles is passed, check permission
      if (allowedRoles && !allowedRoles.includes(membership.role)) {
        throw new ForbiddenError("Insufficient project permissions");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireProjectMember = authorizeProjectRole();
export const requireProjectAdmin = authorizeProjectRole(PROJECT_ADMIN_ROLES);
export const requireProjectManager = authorizeProjectRole(PROJECT_MANAGER_ROLES);
export const requireProjectStaff = authorizeProjectRole(STAFF_ROLES);