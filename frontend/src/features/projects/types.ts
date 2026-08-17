export type ProjectRole =
  | 'project_admin'
  | 'support_agent'
  | 'engineer'
  | 'project_manager'
  | 'client_requester'
  | 'client_org_admin';

export type UserType = 'internal' | 'client';

export interface Project {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  isActive: boolean;
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
  clientOrganisation?: string;
  receivesNewTicketAlerts: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface AddMemberPayload {
  userId: string;
  role: ProjectRole;
  clientOrganisation?: string;
  receivesNewTicketAlerts?: boolean;
}