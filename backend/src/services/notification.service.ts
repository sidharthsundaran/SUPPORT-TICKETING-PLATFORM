import { notificationQueue } from "../jobs/queues.js";
import ProjectMembership from "../models/ProjectMembership.js";
import User from "../models/user.js";
import Ticket, { ITicket } from "../models/Ticket.js";

export class NotificationService {
  /**
   * Helper to resolve team recipients for a project who have receivesNewTicketAlerts: true
   */
  async getTeamRecipientsForProject(projectId: string): Promise<string[]> {
    const memberships = await ProjectMembership.find({
      projectId,
      receivesNewTicketAlerts: true,
    });

    const userIds = memberships.map((m) => m.userId.toString());
    return userIds;
  }

  /**
   * Enqueue New Ticket Notification Job (BR-NTF-001, BR-NTF-002, BR-NTF-003)
   */
  async dispatchNewTicketNotifications(ticket: ITicket): Promise<void> {
    const projectIdStr =
      typeof ticket.projectId === "object" && (ticket.projectId as any)._id
        ? (ticket.projectId as any)._id.toString()
        : ticket.projectId.toString();

    const requesterIdStr =
      typeof ticket.requesterId === "object" && (ticket.requesterId as any)._id
        ? (ticket.requesterId as any)._id.toString()
        : ticket.requesterId.toString();

    // Resolve team members with receivesNewTicketAlerts = true
    const teamUserIds = await this.getTeamRecipientsForProject(projectIdStr);
    
    // Filter out requester if requester is on the team
    const teamRecipientIds = teamUserIds.filter((id) => id !== requesterIdStr);

    if (notificationQueue) {
      await notificationQueue.add(
        "notification.newTicket",
        {
          ticketId: ticket._id.toString(),
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
          description: ticket.description,
          severity: ticket.severity,
          module: ticket.module,
          requesterId: requesterIdStr,
          teamRecipientIds,
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 3000 },
        }
      );
    }
  }

  /**
   * Enqueue Status Change Notification Job (BR-NTF-004, BR-NTF-009)
   */
  async dispatchStatusChangeNotification(
    ticket: ITicket,
    oldStatus: string,
    newStatus: string,
    actorId?: string
  ): Promise<void> {
    const requesterIdStr =
      typeof ticket.requesterId === "object" && (ticket.requesterId as any)._id
        ? (ticket.requesterId as any)._id.toString()
        : ticket.requesterId.toString();

    if (notificationQueue) {
      await notificationQueue.add(
        "notification.statusChange",
        {
          ticketId: ticket._id.toString(),
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
          oldStatus,
          newStatus,
          requesterId: requesterIdStr,
          actorId,
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 3000 },
        }
      );
    }
  }

  /**
   * Enqueue Assignment Notification Job (BR-NTF-005)
   */
  async dispatchAssignmentNotification(
    ticket: ITicket,
    newAssigneeId: string,
    actorId?: string
  ): Promise<void> {
    if (notificationQueue) {
      await notificationQueue.add(
        "notification.assignment",
        {
          ticketId: ticket._id.toString(),
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
          assigneeId: newAssigneeId,
          actorId,
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 3000 },
        }
      );
    }
  }

  /**
   * Enqueue Reply Notification Job (BR-NTF-006, BR-NTF-007)
   */
  async dispatchReplyNotification(
    ticket: ITicket,
    authorId: string,
    commentType: "comment" | "internal_note"
  ): Promise<void> {
    if (commentType === "internal_note") return; // Internal notes not sent to requester

    const projectIdStr =
      typeof ticket.projectId === "object" && (ticket.projectId as any)._id
        ? (ticket.projectId as any)._id.toString()
        : ticket.projectId.toString();

    const requesterIdStr =
      typeof ticket.requesterId === "object" && (ticket.requesterId as any)._id
        ? (ticket.requesterId as any)._id.toString()
        : ticket.requesterId.toString();

    const assigneeIdStr = ticket.assigneeId
      ? typeof ticket.assigneeId === "object" && (ticket.assigneeId as any)._id
        ? (ticket.assigneeId as any)._id.toString()
        : ticket.assigneeId.toString()
      : null;

    const isRequesterReply = authorId === requesterIdStr;

    let recipients: string[] = [];
    if (isRequesterReply) {
      if (assigneeIdStr) {
        recipients = [assigneeIdStr];
      } else {
        recipients = await this.getTeamRecipientsForProject(projectIdStr);
      }
    } else {
      recipients = [requesterIdStr];
    }

    if (notificationQueue && recipients.length > 0) {
      await notificationQueue.add(
        "notification.reply",
        {
          ticketId: ticket._id.toString(),
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
          authorId,
          recipients,
          isRequesterReply,
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 3000 },
        }
      );
    }
  }

  /**
   * Enqueue SLA Notification Job (BR-NTF-008)
   */
  async dispatchSlaNotification(
    ticket: ITicket,
    eventType: "sla_warning" | "sla_breached"
  ): Promise<void> {
    const projectIdStr =
      typeof ticket.projectId === "object" && (ticket.projectId as any)._id
        ? (ticket.projectId as any)._id.toString()
        : ticket.projectId.toString();

    const assigneeIdStr = ticket.assigneeId
      ? typeof ticket.assigneeId === "object" && (ticket.assigneeId as any)._id
        ? (ticket.assigneeId as any)._id.toString()
        : ticket.assigneeId.toString()
      : null;

    // Find Project Manager for the project
    const pmMembership = await ProjectMembership.findOne({
      projectId: projectIdStr,
      role: "project_manager",
    });

    const pmIdStr = pmMembership ? pmMembership.userId.toString() : null;

    const recipientSet = new Set<string>();
    if (assigneeIdStr) recipientSet.add(assigneeIdStr);
    if (pmIdStr) recipientSet.add(pmIdStr);

    const recipients = Array.from(recipientSet);

    if (notificationQueue && recipients.length > 0) {
      await notificationQueue.add(
        "notification.slaEvent",
        {
          ticketId: ticket._id.toString(),
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
          eventType,
          recipients,
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 3000 },
        }
      );
    }
  }
}

export const notificationService = new NotificationService();
