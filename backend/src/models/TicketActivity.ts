import mongoose, { Document, Schema, Types } from "mongoose";

export type TicketActivityAction =
  | "created"
  | "status_changed"
  | "assignee_changed"
  | "severity_changed"
  | "details_updated"
  | "comment_added"
  | "internal_note_added"
  | "evidence_added"
  | "evidence_removed"
  | "sla_warning"
  | "sla_breached";

export interface ITicketActivity extends Document {
  ticketId: Types.ObjectId;
  actorId: Types.ObjectId;
  action: TicketActivityAction;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ticketActivitySchema = new Schema<ITicketActivity>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        "created",
        "status_changed",
        "assignee_changed",
        "severity_changed",
        "details_updated",
        "comment_added",
        "internal_note_added",
        "evidence_added",
        "evidence_removed",
        "sla_warning",
        "sla_breached",
      ],
      required: true,
    },
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

ticketActivitySchema.index({ ticketId: 1, createdAt: -1 });

export default mongoose.model<ITicketActivity>(
  "TicketActivity",
  ticketActivitySchema
);
