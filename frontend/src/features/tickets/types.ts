export type TicketStatus =
  | 'new'
  | 'triaged'
  | 'in_progress'
  | 'awaiting_client_response'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | 'rejected'
  | 'duplicate';

export type TicketSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'enhancement';

export interface TicketUser {
  _id: string;
  name: string;
  email: string;
  userType?: string;
}

export interface TicketProject {
  _id: string;
  name: string;
  code?: string;
}

export interface TicketEvidenceFile {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export type SlaStatus = 'within_sla' | 'approaching_breach' | 'breached';

export interface Ticket {
  _id: string;
  ticketNumber: string;
  projectId: string | TicketProject;
  requesterId: string | TicketUser;
  assigneeId?: string | TicketUser | null;
  clientOrganisation?: string;

  title: string;
  description: string;
  issueType: string;
  module: string;
  tags?: string[];
  severity: TicketSeverity;
  status: TicketStatus;
  environment: string;

  applicationUrl?: string;
  pageUrl?: string;
  evidenceFiles?: TicketEvidenceFile[];
  isArchived: boolean;
  firstResponseAt?: string;
  resolvedAt?: string;
  closedAt?: string;

  slaFirstResponseDueAt?: string;
  slaResolutionDueAt?: string;
  slaFirstResponseStatus?: 'pending' | 'met' | 'breached';
  slaResolutionStatus?: SlaStatus;
  satisfactionRating?: {
    rating: number;
    comment?: string;
    ratedAt?: string;
  };
  slaClock?: {
    pausedAt?: string;
    totalPausedMs?: number;
  };

  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TicketResponse {
  success: boolean;
  message?: string;
  data: Ticket;
}

export interface PaginatedTicketsResponse {
  success: boolean;
  data: Ticket[];
  pagination: PaginationMeta;
}

export interface TicketQueryParams {
  projectId?: string;
  requesterId?: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: TicketStatus;
  severity?: TicketSeverity;
  issueType?: string;
  module?: string;
}

export interface CreateTicketPayload {
  projectId: string;
  title: string;
  description: string;
  issueType: string;
  module: string;
  tags?: string[];
  severity?: TicketSeverity;
  environment: string;
  applicationUrl?: string;
  pageUrl?: string;
  clientOrganisation?: string;
  evidenceFiles?: TicketEvidenceFile[];
}

export interface UpdateTicketPayload {
  ticketId: string;
  title?: string;
  description?: string;
  issueType?: string;
  module?: string;
  severity?: TicketSeverity;
  environment?: string;
  applicationUrl?: string;
  pageUrl?: string;
  retainedEvidenceKeys?: string[];
  newEvidenceFiles?: TicketEvidenceFile[];
}

export interface UpdateTicketStatusPayload {
  ticketId: string;
  status: TicketStatus;
}

export interface AssignTicketPayload {
  ticketId: string;
  assigneeId: string;
}

export type TicketCommentType = 'comment' | 'internal_note';

export interface TicketCommentAuthor {
  _id: string;
  name: string;
  email: string;
  userType?: string;
}

export interface TicketComment {
  _id: string;
  ticketId: string;
  authorId: TicketCommentAuthor | string;
  type: TicketCommentType;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketCommentPayload {
  ticketId: string;
  type: TicketCommentType;
  content: string;
}
