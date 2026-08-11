import { Request, Response, NextFunction } from "express";
import { projectService, ProjectService } from "../services/project.service.js";

export class ProjectController {
  constructor(private readonly service: ProjectService = projectService) {}

  createProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { name, description } = req.body;
      const ownerId = req.user?._id.toString()

      if (!ownerId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return; 
      }

      const project = await this.service.createProject({
        name,
        description,
        ownerId,
      });

      res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: { project },
      });
    } catch (error) {
      next(error);
    }
  };

  getProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const project = await this.service.getProjectById(id);
      res.status(200).json({ success: true, data: { project } });
    } catch (error) {
      next(error);
    }
  };

  getMyProjects = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const memberships = await this.service.getProjectsForUser(userId);
      res.status(200).json({ success: true, data: { memberships } });
    } catch (error) {
      next(error);
    }
  };

  addMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id: projectId } = req.params;
      const { userId, role, clientOrganisation, receivesNewTicketAlerts } = req.body;

      const membership = await this.service.addMember(projectId, {
        userId,
        role,
        clientOrganisation,
        receivesNewTicketAlerts,
      });

      res.status(201).json({
        success: true,
        message: "Member added to project",
        data: { membership },
      });
    } catch (error) {
      next(error);
    }
  };

  getMembers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id: projectId } = req.params;
      const members = await this.service.getProjectMembers(projectId);
      res.status(200).json({ success: true, data: { members } });
    } catch (error) {
      next(error);
    }
  };

  updateMemberRole = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { membershipId } = req.params;
      const { role, clientOrganisation } = req.body;

      const membership = await this.service.updateMemberRole(
        membershipId,
        role,
        clientOrganisation
      );

      res.status(200).json({
        success: true,
        message: "Member role updated",
        data: { membership },
      });
    } catch (error) {
      next(error);
    }
  };

  removeMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { membershipId } = req.params;
      await this.service.removeMember(membershipId);
      res.status(200).json({ success: true, message: "Member removed from project" });
    } catch (error) {
      next(error);
    }
  };
}

export const projectController = new ProjectController();
