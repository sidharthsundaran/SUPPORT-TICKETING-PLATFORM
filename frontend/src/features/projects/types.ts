export type ProjectRole =
  | 'project_admin'
  | 'support_agent'
  | 'engineer'
  | 'project_manager'
  | 'client_requester'
  | 'client_org_admin';

export type UserType = 'internal' | 'client';

export interface ProjectConfigItem {
  name: string;
  isActive: boolean;
}

export interface Project {
  _id: string;
  name: string;
  code: string;
  description?: string;
  ownerId: string;
  status: 'active' | 'inactive';
  isActive: boolean;
  issueTypes?: ProjectConfigItem[];
  modules?: ProjectConfigItem[];
  applicationUrls?: {
    production?: string;
    uat?: string;
    development?: string;
  };
  allowedEmailDomains?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMemberUser {
  _id: string;
  name: string;
  email: string;
  userType: UserType;
}

export interface ProjectMembership {
  _id: string;
  userId: ProjectMemberUser | string;
  projectId: Project | string;
  role: ProjectRole;
  status?: 'pending' | 'active' | 'rejected' | 'deactivated';
  clientOrganisation?: string;
  receivesNewTicketAlerts: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  code?: string;
  description?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  code?: string;
  description?: string;
  status?: 'active' | 'inactive';
  isActive?: boolean;
  issueTypes?: ProjectConfigItem[];
  modules?: ProjectConfigItem[];
}

export interface AddMemberPayload {
  userId: string;
  role: ProjectRole;
  clientOrganisation?: string;
  receivesNewTicketAlerts?: boolean;
}