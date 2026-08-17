import {
  projectRepository,
  ProjectRepository,
  CreateProjectData,
} from "../repositories/project.repository.js";
import {
  projectMembershipRepository,
  ProjectMembershipRepository,
} from "../repositories/project-membership.repository.js";
import {
  projectMembershipService,
  ProjectMembershipService,
  AddMemberDTO,
} from "./project-membership.service.js";
import { IProject } from "../models/Project.js";
import { IProjectMembership, ProjectRole } from "../models/ProjectMembership.js";
import { BadRequestError, NotFoundError } from "../utils/app-error.js";

export class ProjectService {
  constructor(
    private readonly projectRepo: ProjectRepository = projectRepository,
    private readonly membershipRepo: ProjectMembershipRepository = projectMembershipRepository,
    private readonly membershipService: ProjectMembershipService = projectMembershipService
  ) {}

  async createProject(data: CreateProjectData): Promise<IProject> {
    if (!data.name || data.name.trim().length < 2) {
      throw new BadRequestError("Project name must be at least 2 characters long");
    }

    const project = await this.projectRepo.create(data);

    await this.membershipRepo.create({
      userId: data.ownerId,
      projectId: project._id.toString(),
      role: "project_admin",
    });

    return project;
  }

  async getProjectById(projectId: string): Promise<IProject> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    return project;
  }

  async updateProject(
    projectId: string,
    updateData: { name?: string; description?: string; isActive?: boolean }
  ): Promise<IProject> {
    const existing = await this.getProjectById(projectId);

    if (updateData.name !== undefined && updateData.name.trim().length < 2) {
      throw new BadRequestError("Project name must be at least 2 characters long");
    }

    const updated = await this.projectRepo.updateById(projectId, {
      ...(updateData.name !== undefined && { name: updateData.name.trim() }),
      ...(updateData.description !== undefined && { description: updateData.description.trim() }),
      ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
    });

    if (!updated) {
      throw new NotFoundError("Project not found");
    }

    return updated;
  }

  async getProjectsForUser(userId: string): Promise<IProjectMembership[]> {
    return this.membershipRepo.findByUser(userId);
  }

  async addMember(projectId: string, dto: AddMemberDTO): Promise<IProjectMembership> {
    return this.membershipService.addMember(projectId, dto);
  }

  async getProjectMembers(projectId: string): Promise<IProjectMembership[]> {
    return this.membershipService.getProjectMembers(projectId);
  }

  async getMembersByRole(projectId: string, role: ProjectRole): Promise<IProjectMembership[]> {
    return this.membershipService.getMembersByRole(projectId, role);
  }

  async updateMemberRole(
    membershipId: string,
    role: ProjectRole,
    clientOrganisation?: string
  ): Promise<IProjectMembership> {
    return this.membershipService.updateMemberById(membershipId, role, clientOrganisation);
  }

  async removeMember(membershipId: string): Promise<void> {
    await this.membershipService.removeMemberById(membershipId);
  }
}

export const projectService = new ProjectService();
