export type NotificationType =
  | 'new_ticket_team'
  | 'submission_ack'
  | 'status_changed'
  | 'assignment'
  | 'comment_added'
  | 'requester_reply'
  | 'sla_warning'
  | 'sla_breached'
  | 'ticket_resolved';

export interface AppNotification {
  _id: string;
  recipientId: string;
  ticketId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

export interface NotificationsListResponse {
  success: boolean;
  data: AppNotification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
