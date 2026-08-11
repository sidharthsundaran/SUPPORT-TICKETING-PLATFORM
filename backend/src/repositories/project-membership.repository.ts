import ProjectMembership, {
  IProjectMembership,
  ProjectRole,
} from "../models/ProjectMembership.js";
import { Types } from "mongoose";

export interface CreateMembershipData {
  userId: Types.ObjectId | string;
  projectId: Types.ObjectId | string;
  role: ProjectRole;
  clientOrganisation?: string;
  receivesNewTicketAlerts?: boolean;
}

export class ProjectMembershipRepository {
  async create(data: CreateMembershipData): Promise<IProjectMembership> {
    return ProjectMembership.create({
      userId: data.userId,
      projectId: data.projectId,
      role: data.role,
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
    return ProjectMembership.find({
      projectId,
      role,
    })
      .populate("userId", "name email userType")
      .sort({ createdAt: 1 });
  }
   async updateById(
    id: string,
    updateData: Partial<IProjectMembership>
  ): Promise<IProjectMembership | null> {
    return ProjectMembership.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );
  }


  async updateRole(
    id: string,
    role: ProjectRole,
    clientOrganisation?: string
  ): Promise<IProjectMembership | null> {
    return ProjectMembership.findByIdAndUpdate(
      id,
      { role, clientOrganisation },
      { new: true, runValidators: true }
    );
  }

  async deleteById(id: string): Promise<IProjectMembership | null> {
    return ProjectMembership.findByIdAndDelete(id);
  }
}

export const projectMembershipRepository = new ProjectMembershipRepository();
