import {
  ticketCommentRepository,
  TicketCommentRepository,
} from "../repositories/ticket-comment.repository.js";
import {
  ticketRepository,
  TicketRepository,
} from "../repositories/ticket.repository.js";
import {
  projectMembershipRepository,
  ProjectMembershipRepository,
} from "../repositories/project-membership.repository.js";
import {
  ticketActivityRepository,
  TicketActivityRepository,
} from "../repositories/ticket-activity.repository.js";
import {
  userRepository,
  UserRepository,
} from "../repositories/user.repository.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/app-error.js";
import { ITicketComment, TicketCommentType } from "../models/TicketComment.js";
import { ProjectRole } from "../models/ProjectMembership.js";
import { notificationService } from "./notification.service.js";

const INTERNAL_ROLES: ProjectRole[] = [
  "project_admin",
  "project_manager",
  "support_agent",
  "engineer",
];

export interface CreateCommentInput {
  ticketId: string;
  authorId: string;
  isPlatformAdmin?: boolean;
  type: TicketCommentType;
  content: string;
}

export class TicketCommentService {
  constructor(
    private readonly commentRepo: TicketCommentRepository = ticketCommentRepository,
    private readonly ticketRepo: TicketRepository = ticketRepository,
    private readonly membershipRepo: ProjectMembershipRepository = projectMembershipRepository,
    private readonly activityRepo: TicketActivityRepository = ticketActivityRepository,
    private readonly userRepo: UserRepository = userRepository
  ) {}

  async createComment(input: CreateCommentInput): Promise<ITicketComment> {
    const { ticketId, authorId, isPlatformAdmin, type, content } = input;

    const trimmedContent = content?.trim();
    if (!trimmedContent) {
      throw new BadRequestError("Comment content cannot be empty");
    }

    if (trimmedContent.length > 5000) {
      throw new BadRequestError("Comment content exceeds maximum length of 5000 characters");
    }

    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket || ticket.isArchived) {
      throw new NotFoundError("Ticket not found");
    }

    const projectIdStr =
      typeof ticket.projectId === "object" && (ticket.projectId as any)._id
        ? (ticket.projectId as any)._id.toString()
        : ticket.projectId.toString();

    // Check Membership & Permissions
    const user = await this.userRepo.findById(authorId);

    if (user?.userType === "client" && type === "internal_note") {
      throw new ForbiddenError("Only internal team members can create internal notes");
    }

    const membership = await this.membershipRepo.findByUserAndProject(
      authorId,
      projectIdStr
    );

    const isInternalUser =
      Boolean(isPlatformAdmin) ||
      user?.isPlatformAdmin ||
      (user?.userType === "internal" && membership && INTERNAL_ROLES.includes(membership.role));

    if (type === "internal_note" && !isInternalUser) {
      throw new ForbiddenError("Only internal team members can create internal notes");
    }

    const comment = await this.commentRepo.create({
      ticketId,
      authorId,
      type,
      content: trimmedContent,
    });

    // Log Activity
    await this.activityRepo.create({
      ticketId,
      actorId: authorId,
      action: type === "internal_note" ? "internal_note_added" : "comment_added",
      metadata: {
        commentId: comment._id.toString(),
      },
    });

    // First Response SLA Stop: if staff posts response and firstResponseAt is not set
    if (isInternalUser && (!ticket.firstResponseAt || ticket.slaFirstResponseStatus === "pending")) {
      const now = new Date();
      const dueAt = ticket.slaFirstResponseDueAt ? new Date(ticket.slaFirstResponseDueAt) : null;
      const slaFirstResponseStatus = dueAt && now <= dueAt ? "met" : "breached";

      await this.ticketRepo.updateById(ticketId, {
        firstResponseAt: now,
        slaFirstResponseStatus,
      });
    }

    // Dispatch Reply Notification (BR-NTF-006, BR-NTF-007)
    await notificationService.dispatchReplyNotification(ticket, authorId, type);

    return comment;
  }

  async getTicketComments(
    ticketId: string,
    userId: string,
    isPlatformAdmin?: boolean
  ): Promise<ITicketComment[]> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket || ticket.isArchived) {
      throw new NotFoundError("Ticket not found");
    }

    const projectIdStr =
      typeof ticket.projectId === "object" && (ticket.projectId as any)._id
        ? (ticket.projectId as any)._id.toString()
        : ticket.projectId.toString();

    const user = await this.userRepo.findById(userId);

    let includeInternalNotes = false;

    if (user?.isPlatformAdmin || isPlatformAdmin) {
      includeInternalNotes = true;
    } else if (user && user.userType === "internal") {
      const membership = await this.membershipRepo.findByUserAndProject(
        userId,
        projectIdStr
      );

      if (membership && INTERNAL_ROLES.includes(membership.role)) {
        includeInternalNotes = true;
      }
    }

    return this.commentRepo.findByTicketId(ticketId, includeInternalNotes);
  }
}

export const ticketCommentService = new TicketCommentService();
