import mongoose, { Document, Schema, Types } from "mongoose";

export type TicketCommentType = "comment" | "internal_note";

export interface ITicketComment extends Document {
  ticketId: Types.ObjectId;
  authorId: Types.ObjectId;
  type: TicketCommentType;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const ticketCommentSchema = new Schema<ITicketComment>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["comment", "internal_note"],
      required: true,
      default: "comment",
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
  },
  {
    timestamps: true,
  }
);

ticketCommentSchema.index({
  ticketId: 1,
  createdAt: 1,
});

export const TicketComment = mongoose.model<ITicketComment>(
  "TicketComment",
  ticketCommentSchema
);

export default TicketComment;
