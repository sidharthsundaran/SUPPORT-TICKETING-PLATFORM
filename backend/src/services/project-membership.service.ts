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
import AuditLog from "../models/AuditLog.js";

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
  userId: string;
  role: ProjectRole;
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
    private readonly membershipRepo: ProjectMembershipRepository =
      projectMembershipRepository,

    private readonly projectRepo: ProjectRepository =
      projectRepository,

    private readonly userRepo: UserRepository =
      userRepository
  ) {}

  async addMember(
    projectId: string,
    dto: AddMemberDTO
  ): Promise<IProjectMembership> {
    const { userId, role } = dto;

    this.validateRole(role);

    await this.validateProject(projectId);

    const user = await this.validateUser(userId);

    await this.validateUserRole(user.userType, role);

    await this.validateNotAlreadyMember(
      userId,
      projectId
    );

    this.validateOrganisation(role, dto.clientOrganisation);

    const project = await this.validateProject(projectId);
    const userDomain = user.email.split("@")[1]?.toLowerCase();
    const allowedDomains = project.allowedEmailDomains || [];

    // Auto-approve if userType is internal OR domain matches allowedEmailDomains, else pending (BR-ACC-005 & BR-ACC-008)
    const isDomainMatch = userDomain && allowedDomains.includes(userDomain);
    const status = user.userType === "internal" || isDomainMatch ? "active" : "pending";

    return this.membershipRepo.create({
      userId,
      projectId,
      role,
      status,
      clientOrganisation: dto.clientOrganisation?.trim(),
      receivesNewTicketAlerts: dto.receivesNewTicketAlerts ?? false,
    });
  }

  async getPendingMemberships(projectId: string): Promise<IProjectMembership[]> {
    await this.validateProject(projectId);
    return this.membershipRepo.find({ projectId, status: "pending" } as any, {});
  }

  async approveMembership(membershipId: string, actorId?: string): Promise<IProjectMembership> {
    const updated = await this.membershipRepo.updateById(membershipId, { status: "active" } as any);
    if (!updated) throw new NotFoundError("Project membership not found");

    try {
      await AuditLog.create({
        action: "PROJECT_ACCESS_APPROVAL",
        actorId: actorId || updated.userId,
        targetId: updated._id,
        details: { action: "approve", previousStatus: "pending", newStatus: "active", projectId: updated.projectId },
      });
    } catch (err) {
      console.error("[AuditLog Error]:", err);
    }

    return updated;
  }

  async rejectMembership(membershipId: string, actorId?: string): Promise<IProjectMembership> {
    const updated = await this.membershipRepo.updateById(membershipId, { status: "rejected" } as any);
    if (!updated) throw new NotFoundError("Project membership not found");

    try {
      await AuditLog.create({
        action: "PROJECT_ACCESS_APPROVAL",
        actorId: actorId || updated.userId,
        targetId: updated._id,
        details: { action: "reject", previousStatus: "pending", newStatus: "rejected", projectId: updated.projectId },
      });
    } catch (err) {
      console.error("[AuditLog Error]:", err);
    }

    return updated;
  }

  async deactivateMembership(membershipId: string, actorId?: string): Promise<IProjectMembership> {
    const updated = await this.membershipRepo.updateById(membershipId, { status: "deactivated" } as any);
    if (!updated) throw new NotFoundError("Project membership not found");

    try {
      await AuditLog.create({
        action: "PROJECT_ACCESS_APPROVAL",
        actorId: actorId || updated.userId,
        targetId: updated._id,
        details: { action: "deactivate", previousStatus: "active", newStatus: "deactivated", projectId: updated.projectId },
      });
    } catch (err) {
      console.error("[AuditLog Error]:", err);
    }

    return updated;
  }

  async reactivateMembership(membershipId: string, actorId?: string): Promise<IProjectMembership> {
    const updated = await this.membershipRepo.updateById(membershipId, { status: "active" } as any);
    if (!updated) throw new NotFoundError("Project membership not found");

    try {
      await AuditLog.create({
        action: "PROJECT_ACCESS_APPROVAL",
        actorId: actorId || updated.userId,
        targetId: updated._id,
        details: { action: "reactivate", previousStatus: "deactivated", newStatus: "active", projectId: updated.projectId },
      });
    } catch (err) {
      console.error("[AuditLog Error]:", err);
    }

    return updated;
  }

  async getProjectMembers(
    projectId: string
  ): Promise<IProjectMembership[]> {
    await this.validateProject(projectId);

    return this.membershipRepo.findByProject(
      projectId
    );
  }

  async getMembersByRole(
    projectId: string,
    role: ProjectRole
  ): Promise<IProjectMembership[]> {
    await this.validateProject(projectId);
    this.validateRole(role);

    return this.membershipRepo.findByProjectAndRole(
      projectId,
      role
    );
  }

  async getUserMemberships(
    userId: string
  ): Promise<IProjectMembership[]> {
    await this.validateUser(userId);

    return this.membershipRepo.findByUser(userId);
  }

  async updateMember(
    projectId: string,
    userId: string,
    dto: UpdateMemberDTO
  ): Promise<IProjectMembership> {
    const membership =
      await this.membershipRepo.findByUserAndProject(
        userId,
        projectId
      );

    if (!membership) {
      throw new NotFoundError(
        "Project membership not found"
      );
    }

    if (dto.role) {
      this.validateRole(dto.role);

      const user =
        await this.validateUser(userId);

      await this.validateUserRole(
        user.userType,
        dto.role
      );

      this.validateOrganisation(
        dto.role,
        dto.clientOrganisation ??
          membership.clientOrganisation
      );
    }

    const updateData: Partial<IProjectMembership> =
      {};

    if (dto.role !== undefined) {
      updateData.role = dto.role;
    }

    if (
      dto.clientOrganisation !== undefined
    ) {
      updateData.clientOrganisation =
        dto.clientOrganisation.trim();
    }

    if (
      dto.receivesNewTicketAlerts !== undefined
    ) {
      updateData.receivesNewTicketAlerts =
        dto.receivesNewTicketAlerts;
    }

    const updated =
      await this.membershipRepo.updateById(
        membership._id.toString(),
        updateData
      );

    if (!updated) {
      throw new NotFoundError(
        "Project membership not found"
      );
    }

    return updated;
  }

  async updateMemberById(
    membershipId: string,
    role: ProjectRole,
    clientOrganisation?: string
  ): Promise<IProjectMembership> {
    this.validateRole(role);

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

  async removeMember(
    projectId: string,
    userId: string
  ): Promise<void> {
    const membership =
      await this.membershipRepo.findByUserAndProject(
        userId,
        projectId
      );

    if (!membership) {
      throw new NotFoundError(
        "Project membership not found"
      );
    }

    if (membership.role === "project_admin") {
      throw new BadRequestError(
        "Project administrator cannot be removed directly"
      );
    }

    await this.membershipRepo.deleteById(
      membership._id.toString()
    );
  }

  async removeMemberById(membershipId: string): Promise<void> {
    const deleted = await this.membershipRepo.deleteById(membershipId);

    if (!deleted) {
      throw new NotFoundError("Project membership not found");
    }
  }

  private validateRole(
    role: ProjectRole
  ): void {
    if (!VALID_ROLES.includes(role)) {
      throw new BadRequestError(
        "Invalid project role"
      );
    }
  }

  private async validateProject(
    projectId: string
  ) {
    const project =
      await this.projectRepo.findById(projectId);

    if (!project) {
      throw new NotFoundError(
        "Project not found"
      );
    }

    if (!project.isActive) {
      throw new BadRequestError(
        "Project is inactive"
      );
    }

    return project;
  }

  private async validateUser(
    userId: string
  ) {
    const user =
      await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError(
        "User not found"
      );
    }

    if (!user.isActive) {
      throw new BadRequestError(
        "User account is inactive"
      );
    }

    return user;
  }

  private async validateNotAlreadyMember(
    userId: string,
    projectId: string
  ): Promise<void> {
    const existing =
      await this.membershipRepo.findByUserAndProject(
        userId,
        projectId
      );

    if (existing) {
      throw new ConflictError(
        "User is already a member of this project"
      );
    }
  }

  private async validateUserRole(
    userType: "internal" | "client",
    role: ProjectRole
  ): Promise<void> {
    const isClientRole =
      CLIENT_ROLES.includes(role);

    if (
      isClientRole &&
      userType !== "client"
    ) {
      throw new BadRequestError(
        "Client roles can only be assigned to client users"
      );
    }

    if (
      !isClientRole &&
      userType !== "internal"
    ) {
      throw new BadRequestError(
        "Internal roles can only be assigned to internal users"
      );
    }
  }

  private validateOrganisation(
    role: ProjectRole,
    organisation?: string
  ): void {
    const isClientRole =
      CLIENT_ROLES.includes(role);

    if (
      isClientRole &&
      !organisation?.trim()
    ) {
      throw new BadRequestError(
        "clientOrganisation is required for client roles"
      );
    }

    if (
      !isClientRole &&
      organisation
    ) {
      throw new BadRequestError(
        "clientOrganisation is only allowed for client roles"
      );
    }
  }
}

export const projectMembershipService =
  new ProjectMembershipService();