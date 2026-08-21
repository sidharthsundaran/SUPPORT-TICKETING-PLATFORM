import ProjectMembership, {
  IProjectMembership,
  ProjectRole,
  MembershipStatus,
} from "../models/ProjectMembership.js";
import { Types } from "mongoose";

export interface CreateMembershipData {
  userId: Types.ObjectId | string;
  projectId: Types.ObjectId | string;
  role: ProjectRole;
  status?: MembershipStatus;
  clientOrganisation?: string;
  receivesNewTicketAlerts?: boolean;
}

export class ProjectMembershipRepository {
  async create(data: CreateMembershipData): Promise<IProjectMembership> {
    return ProjectMembership.create({
      userId: data.userId,
      projectId: data.projectId,
      role: data.role,
      status: data.status || "active",
      clientOrganisation: data.clientOrganisation,
      receivesNewTicketAlerts: data.receivesNewTicketAlerts ?? false,
    });
  }

  async findByUserAndProject(
    userId: string,
    projectId: string
  ): Promise<IProjectMembership | null> {
    return ProjectMembership.findOne({ userId, projectId });
  }

  async findByProject(projectId: string): Promise<IProjectMembership[]> {
    return ProjectMembership.find({ projectId }).populate("userId", "name email userType");
  }

  async findByUser(userId: string): Promise<IProjectMembership[]> {
    return ProjectMembership.find({ userId }).populate("projectId", "name description isActive");
  }

  async findByProjectAndRole(
    projectId: string,
    role: ProjectRole
  ): Promise<IProjectMembership[]> {
    return ProjectMembership.find({ projectId, role }).populate("userId", "name email userType");
  }

  async updateRole(
    membershipId: string,
    role: ProjectRole,
    clientOrganisation?: string
  ): Promise<IProjectMembership | null> {
    const updateData: Record<string, any> = { role };
    if (clientOrganisation !== undefined) {
      updateData.clientOrganisation = clientOrganisation;
    }
    return ProjectMembership.findByIdAndUpdate(membershipId, updateData, { new: true });
  }

  async updateById(
    membershipId: string,
    updateData: Partial<IProjectMembership>
  ): Promise<IProjectMembership | null> {
    return ProjectMembership.findByIdAndUpdate(membershipId, updateData, { new: true });
  }

  async deleteById(membershipId: string): Promise<IProjectMembership | null> {
    return ProjectMembership.findByIdAndDelete(membershipId);
  }

  async find(query: Record<string, any>, options: Record<string, any> = {}): Promise<IProjectMembership[]> {
    return ProjectMembership.find(query).populate("userId", "name email userType");
  }
}

export const projectMembershipRepository = new ProjectMembershipRepository();
