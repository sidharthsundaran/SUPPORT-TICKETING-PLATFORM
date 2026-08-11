import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../utils/app-error.js";
import {
  projectMembershipRepository,
  ProjectMembershipRepository,
} from "../repositories/project-membership.repository.js";
import {
  projectRepository,
  ProjectRepository,
} from "../repositories/project.repository.js";
import {
  userRepository,
  UserRepository,
} from "../repositories/user.repository.js";
import {
  ProjectRole,
  IProjectMembership,
} from "../models/ProjectMembership.js";

const VALID_ROLES: ProjectRole[] = [
  "project_admin",
  "support_agent",
  "engineer",
  "project_manager",
  "client_requester",
  "client_org_admin",
];

const CLIENT_ROLES: ProjectRole[] = [
  "client_requester",
  "client_org_admin",
];

export interface AddMemberDTO {
  userId?: string;
  role?: ProjectRole;
  clientOrganisation?: string;
  receivesNewTicketAlerts?: boolean;
}

export interface UpdateMemberDTO {
  role?: ProjectRole;
  clientOrganisation?: string;
  receivesNewTicketAlerts?: boolean;
}

export class ProjectMembershipService {
  constructor(
    private readonly membershipRepo: ProjectMembershipRepository = projectMembershipRepository,
    private readonly projectRepo: ProjectRepository = projectRepository,
    private readonly userRepo: UserRepository = userRepository
  ) {}

  async addMember(projectId: string, dto: AddMemberDTO): Promise<IProjectMembership> {
    const { userId, role, clientOrganisation, receivesNewTicketAlerts } = dto;

    if (!userId || !role) {
      throw new BadRequestError("userId and role are required");
    }

    if (!VALID_ROLES.includes(role)) {
      throw new BadRequestError("Invalid project role");
    }

    const project = await this.projectRepo.findById(projectId);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (!project.isActive) {
      throw new BadRequestError("Cannot add members to an inactive project");
    }

    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.isActive) {
      throw new BadRequestError("Cannot add an inactive user");
    }

    const existingMembership = await this.membershipRepo.findByUserAndProject(
      userId,
      projectId
    );

    if (existingMembership) {
      throw new ConflictError("User is already a member of this project");
    }

    if (CLIENT_ROLES.includes(role) && !clientOrganisation?.trim()) {
      throw new BadRequestError(
        "clientOrganisation is required for client roles"
      );
    }

    if (!CLIENT_ROLES.includes(role) && clientOrganisation) {
      throw new BadRequestError(
        "clientOrganisation is only allowed for client roles"
      );
    }

    if (CLIENT_ROLES.includes(role) && user.userType !== "client") {
      throw new BadRequestError(
        "Client roles can only be assigned to client users"
      );
    }

    if (!CLIENT_ROLES.includes(role) && user.userType !== "internal") {
      throw new BadRequestError(
        "Internal project roles can only be assigned to internal users"
      );
    }

    return this.membershipRepo.create({
      userId,
      projectId,
      role,
      clientOrganisation: clientOrganisation?.trim(),
      receivesNewTicketAlerts: receivesNewTicketAlerts ?? false,
    });
  }

  async getProjectMembers(projectId: string): Promise<IProjectMembership[]> {
    const project = await this.projectRepo.findById(projectId);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    return this.membershipRepo.findByProject(projectId);
  }

  async getMembersByRole(projectId: string, role: ProjectRole): Promise<IProjectMembership[]> {
    const project = await this.projectRepo.findById(projectId);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (!VALID_ROLES.includes(role)) {
      throw new BadRequestError("Invalid project role");
    }

    return this.membershipRepo.findByProjectAndRole(projectId, role);
  }

  async getUserMemberships(userId: string): Promise<IProjectMembership[]> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return this.membershipRepo.findByUser(userId);
  }

  async updateMember(
    projectId: string,
    userId: string,
    dto: UpdateMemberDTO
  ): Promise<IProjectMembership | null> {
    const membership = await this.membershipRepo.findByUserAndProject(
      userId,
      projectId
    );

    if (!membership) {
      throw new NotFoundError("Project membership not found");
    }

    if (dto.role) {
      if (!VALID_ROLES.includes(dto.role)) {
        throw new BadRequestError("Invalid project role");
      }

      const user = await this.userRepo.findById(userId);

      if (!user) {
        throw new NotFoundError("User not found");
      }

      if (CLIENT_ROLES.includes(dto.role) && user.userType !== "client") {
        throw new BadRequestError(
          "Client roles can only be assigned to client users"
        );
      }

      if (!CLIENT_ROLES.includes(dto.role) && user.userType !== "internal") {
        throw new BadRequestError(
          "Internal project roles can only be assigned to internal users"
        );
      }

      if (
        CLIENT_ROLES.includes(dto.role) &&
        !(dto.clientOrganisation?.trim() || membership.clientOrganisation)
      ) {
        throw new BadRequestError(
          "clientOrganisation is required for client roles"
        );
      }

      if (!CLIENT_ROLES.includes(dto.role) && dto.clientOrganisation) {
        throw new BadRequestError(
          "clientOrganisation is only allowed for client roles"
        );
      }
    }

    const updateData: Partial<IProjectMembership> = {};

    if (dto.role !== undefined) {
      updateData.role = dto.role;
    }

    if (dto.receivesNewTicketAlerts !== undefined) {
      updateData.receivesNewTicketAlerts = dto.receivesNewTicketAlerts;
    }

    if (dto.clientOrganisation !== undefined) {
      updateData.clientOrganisation = dto.clientOrganisation.trim();
    }

    return this.membershipRepo.updateById(
      membership._id.toString(),
      updateData
    );
  }

  async updateMemberById(
    membershipId: string,
    role: ProjectRole,
    clientOrganisation?: string
  ): Promise<IProjectMembership> {
    if (!VALID_ROLES.includes(role)) {
      throw new BadRequestError("Invalid project role");
    }

    const updated = await this.membershipRepo.updateRole(
      membershipId,
      role,
      clientOrganisation
    );

    if (!updated) {
      throw new NotFoundError("Project membership not found");
    }

    return updated;
  }

  async removeMember(projectId: string, userId: string): Promise<IProjectMembership | null> {
    const membership = await this.membershipRepo.findByUserAndProject(
      userId,
      projectId
    );

    if (!membership) {
      throw new NotFoundError("Project membership not found");
    }

    if (membership.role === "project_admin") {
      throw new BadRequestError(
        "Project administrator cannot be removed directly"
      );
    }

    return this.membershipRepo.deleteById(membership._id.toString());
  }

  async removeMemberById(membershipId: string): Promise<void> {
    const deleted = await this.membershipRepo.deleteById(membershipId);

    if (!deleted) {
      throw new NotFoundError("Project membership not found");
    }
  }
}

export const projectMembershipService = new ProjectMembershipService();
