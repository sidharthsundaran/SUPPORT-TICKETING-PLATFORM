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
import { IProject, ProjectConfigItem } from "../models/Project.js";
import { IProjectMembership, ProjectRole } from "../models/ProjectMembership.js";
import { BadRequestError, NotFoundError, ConflictError } from "../utils/app-error.js";

export const BRD_DEFAULT_ISSUE_TYPES: ProjectConfigItem[] = [
  { name: "Bug / Defect", isActive: true },
  { name: "How-to Question", isActive: true },
  { name: "Data Issue", isActive: true },
  { name: "Access and Permissions", isActive: true },
  { name: "Performance", isActive: true },
  { name: "Enhancement Request", isActive: true },
  { name: "Integration Issue", isActive: true },
  { name: "Other", isActive: true },
];

export const BRD_DEFAULT_MODULES: ProjectConfigItem[] = [
  { name: "Job Requisition", isActive: true },
  { name: "Candidate Pipeline", isActive: true },
  { name: "Resume-JD Matching", isActive: true },
  { name: "Voice Bot / Screening", isActive: true },
  { name: "Mailbox", isActive: true },
  { name: "Career Page", isActive: true },
  { name: "Offer Letter", isActive: true },
  { name: "Trivia", isActive: true },
  { name: "Analytics Dashboard", isActive: true },
  { name: "WhatsApp / Teams Integration", isActive: true },
  { name: "User and Role Management", isActive: true },
  { name: "Login and Authentication", isActive: true },
  { name: "Other", isActive: true },
];

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

    let code = (data.code || this.generateProjectCode(data.name)).toUpperCase();

    const existingCode = await this.projectRepo.findByCode(code);
    if (existingCode) {
      code = `${code}${Math.floor(10 + Math.random() * 90)}`;
    }

    const projectData: CreateProjectData = {
      ...data,
      code,
      issueTypes: data.issueTypes?.length ? data.issueTypes : BRD_DEFAULT_ISSUE_TYPES,
      modules: data.modules?.length ? data.modules : BRD_DEFAULT_MODULES,
    };

    const project = await this.projectRepo.create(projectData);

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
    updateData: Partial<IProject>
  ): Promise<IProject> {
    const existing = await this.getProjectById(projectId);

    if (updateData.name !== undefined && updateData.name.trim().length < 2) {
      throw new BadRequestError("Project name must be at least 2 characters long");
    }

    const updated = await this.projectRepo.updateById(projectId, updateData);

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

  private generateProjectCode(name: string): string {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 3).toUpperCase();
  }
}

export const projectService = new ProjectService();
