import Project, { IProject, ProjectConfigItem } from "../models/Project.js";

export interface CreateProjectData {
  name: string;
  code?: string;
  description?: string;
  ownerId: string;
  issueTypes?: ProjectConfigItem[];
  modules?: ProjectConfigItem[];
  applicationUrls?: {
    production?: string;
    uat?: string;
    development?: string;
  };
  allowedEmailDomains?: string[];
}

export class ProjectRepository {
  async create(data: CreateProjectData): Promise<IProject> {
    return Project.create({
      name: data.name.trim(),
      code: (data.code || "TKT").trim().toUpperCase(),
      description: data.description?.trim(),
      ownerId: data.ownerId.trim(),
      issueTypes: data.issueTypes || [],
      modules: data.modules || [],
      applicationUrls: data.applicationUrls,
      allowedEmailDomains: data.allowedEmailDomains || [],
    });
  }

  async findById(id: string): Promise<IProject | null> {
    return Project.findById(id);
  }

  async findByCode(code: string): Promise<IProject | null> {
    return Project.findOne({ code: code.trim().toUpperCase() });
  }

  async findAll(): Promise<IProject[]> {
    return Project.find().sort({ createdAt: -1 });
  }

  async findActive(): Promise<IProject[]> {
    return Project.find({
      $or: [{ status: "active" }, { isActive: true }],
    }).sort({ createdAt: -1 });
  }

  async updateById(
    id: string,
    updateData: Partial<IProject>
  ): Promise<IProject | null> {
    return Project.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id: string): Promise<IProject | null> {
    return Project.findByIdAndDelete(id);
  }
}

export const projectRepository = new ProjectRepository();