import mongoose, { Document, Schema, Types } from "mongoose";

export type TicketStatus =
  | "new"
  | "triaged"
  | "in_progress"
  | "awaiting_client_response"
  | "resolved"
  | "closed"
  | "reopened"
  | "rejected"
  | "duplicate";

export type TicketSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "enhancement";

export interface ITicketEvidenceFile {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface ITicket extends Document {
  ticketNumber: string;

  projectId: Types.ObjectId;

  requesterId: Types.ObjectId;
  clientOrganisation?: string;

  title: string;
  description: string;

  issueType: string;
  module: string;
  tags?: string[];
  severity: TicketSeverity;
  environment: string;

  applicationUrl?: string;
  pageUrl?: string;
  evidenceFiles?: ITicketEvidenceFile[];

  status: TicketStatus;

  assigneeId?: Types.ObjectId;

  sessionContext?: {
    browser?: string;
    os?: string;
    device?: string;
    timezone?: string;
  };

  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;

  slaFirstResponseDueAt?: Date;
  slaResolutionDueAt?: Date;
  slaFirstResponseStatus?: "pending" | "met" | "breached";
  slaResolutionStatus?: "within_sla" | "approaching_breach" | "breached";
  satisfactionRating?: {
    rating: number;
    comment?: string;
    ratedAt?: Date;
  };
  slaClock?: {
    pausedAt?: Date;
    totalPausedMs?: number;
  };

  isArchived: boolean;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    requesterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    clientOrganisation: {
      type: String,
      trim: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    issueType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    module: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    tags: [{ type: String, trim: true }],

    severity: {
      type: String,
      enum: [
        "critical",
        "high",
        "medium",
        "low",
        "enhancement",
      ],
      required: true,
      default: "medium",
      index: true,
    },

    environment: {
      type: String,
      required: true,
      trim: true,
    },

    applicationUrl: {
      type: String,
      trim: true,
    },

    pageUrl: {
      type: String,
      trim: true,
    },

    evidenceFiles: [
      {
        key: { type: String, required: true },
        originalName: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        url: { type: String, required: true },
      },
    ],

    status: {
      type: String,
      enum: [
        "new",
        "triaged",
        "in_progress",
        "awaiting_client_response",
        "resolved",
        "closed",
        "reopened",
        "rejected",
        "duplicate",
      ],
      default: "new",
      required: true,
      index: true,
    },

    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    sessionContext: {
      browser: String,
      os: String,
      device: String,
      timezone: String,
    },

    firstResponseAt: Date,

    resolvedAt: Date,

    closedAt: Date,

    slaFirstResponseDueAt: Date,

    slaResolutionDueAt: Date,

    slaFirstResponseStatus: {
      type: String,
      enum: ["pending", "met", "breached"],
      default: "pending",
    },

    slaResolutionStatus: {
      type: String,
      enum: ["within_sla", "approaching_breach", "breached"],
      default: "within_sla",
      index: true,
    },

    satisfactionRating: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true },
      ratedAt: { type: Date, default: Date.now },
    },

    slaClock: {
      pausedAt: Date,
      totalPausedMs: { type: Number, default: 0 },
    },

    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

ticketSchema.index({
  projectId: 1,
  status: 1,
});

ticketSchema.index({
  projectId: 1,
  severity: 1,
});

ticketSchema.index({
  projectId: 1,
  requesterId: 1,
});

ticketSchema.index({
  projectId: 1,
  assigneeId: 1,
});

ticketSchema.index({
  title: "text",
  description: "text",
  ticketNumber: "text",
});

export default mongoose.model<ITicket>(
  "Ticket",
  ticketSchema
);