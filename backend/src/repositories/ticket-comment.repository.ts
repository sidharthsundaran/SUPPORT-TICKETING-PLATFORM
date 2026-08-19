import { Types } from "mongoose";
import TicketComment, {
  ITicketComment,
  TicketCommentType,
} from "../models/TicketComment.js";

export interface CreateTicketCommentData {
  ticketId: string;
  authorId: string;
  type: TicketCommentType;
  content: string;
}

export class TicketCommentRepository {
  async create(data: CreateTicketCommentData): Promise<ITicketComment> {
    const comment = await TicketComment.create({
      ticketId: new Types.ObjectId(data.ticketId),
      authorId: new Types.ObjectId(data.authorId),
      type: data.type,
      content: data.content,
    });

    return comment.populate("authorId", "name email userType");
  }

  async findByTicketId(
    ticketId: string,
    includeInternalNotes: boolean = true
  ): Promise<ITicketComment[]> {
    const query: Record<string, any> = {
      ticketId: new Types.ObjectId(ticketId),
    };

    if (!includeInternalNotes) {
      query.type = "comment";
    }

    return TicketComment.find(query)
      .populate("authorId", "name email userType")
      .sort({ createdAt: 1 })
      .exec();
  }

  async findById(commentId: string): Promise<ITicketComment | null> {
    return TicketComment.findById(commentId)
      .populate("authorId", "name email userType")
      .exec();
  }

  async delete(commentId: string): Promise<ITicketComment | null> {
    return TicketComment.findByIdAndDelete(commentId).exec();
  }
}

export const ticketCommentRepository = new TicketCommentRepository();
