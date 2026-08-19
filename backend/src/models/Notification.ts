import mongoose, { Document, Schema, Types } from "mongoose";

export type NotificationType =
  | "new_ticket_team"
  | "submission_ack"
  | "status_changed"
  | "assignment"
  | "comment_added"
  | "requester_reply"
  | "sla_warning"
  | "sla_breached"
  | "ticket_resolved";

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  ticketId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "new_ticket_team",
        "submission_ack",
        "status_changed",
        "assignment",
        "comment_added",
        "requester_reply",
        "sla_warning",
        "sla_breached",
        "ticket_resolved",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>("Notification", notificationSchema);
