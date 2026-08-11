import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  projectMembershipService,
  ProjectMembershipService,
} from "../services/project-membership.service.js";

export class ProjectMembershipController {
  constructor(
    private readonly service: ProjectMembershipService =
      projectMembershipService
  ) {}

  // POST /api/projects/:projectId/members
  addMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { projectId } = req.params;

      const membership =
        await this.service.addMember(
          projectId,
          req.body
        );

      res.status(201).json({
        success: true,
        message: "Member added successfully",
        data: membership,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/projects/:projectId/members
  getProjectMembers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { projectId } = req.params;

      const members =
        await this.service.getProjectMembers(
          projectId
        );

      res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/users/:userId/memberships
  getUserMemberships = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = req.params;

      const memberships =
        await this.service.getUserMemberships(
          userId
        );

      res.status(200).json({
        success: true,
        data: memberships,
      });
    } catch (error) {
      next(error);
    }
  };

  // PATCH /api/projects/:projectId/members/:userId
  updateMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { projectId, userId } =
        req.params;

      const membership =
        await this.service.updateMember(
          projectId,
          userId,
          req.body
        );

      res.status(200).json({
        success: true,
        message: "Member updated successfully",
        data: membership,
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/projects/:projectId/members/:userId
  removeMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { projectId, userId } =
        req.params;

      await this.service.removeMember(
        projectId,
        userId
      );

      res.status(200).json({
        success: true,
        message: "Member removed successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export const projectMembershipController = new ProjectMembershipController();
