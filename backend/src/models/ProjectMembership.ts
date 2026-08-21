import mongoose, { Document, Schema, Types } from "mongoose";

export type ProjectRole =
  | "project_admin"
  | "support_agent"
  | "engineer"
  | "project_manager"
  | "client_requester"
  | "client_org_admin";

export type MembershipStatus = "pending" | "active" | "rejected" | "deactivated";

export interface IProjectMembership extends Document {
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  role: ProjectRole;
  status: MembershipStatus;
  clientOrganisation?: string;
  receivesNewTicketAlerts: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CLIENT_ROLES: ProjectRole[] = [
  "client_requester",
  "client_org_admin",
];

const projectMembershipSchema = new Schema<IProjectMembership>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: [
        "project_admin",
        "support_agent",
        "engineer",
        "project_manager",
        "client_requester",
        "client_org_admin",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "active", "rejected", "deactivated"],
      default: "active",
      index: true,
    },

    clientOrganisation: {
      type: String,
      trim: true,
    },

    receivesNewTicketAlerts: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

projectMembershipSchema.index(
  { userId: 1, projectId: 1 },
  { unique: true }
);

projectMembershipSchema.pre("validate", function (this: IProjectMembership) {
  const role = this.role as ProjectRole;

  if (!role) return;

  if (CLIENT_ROLES.includes(role) && !this.clientOrganisation) {
    throw new Error(
      "clientOrganisation is required for client_requester and client_org_admin roles"
    );
  }

  if (!CLIENT_ROLES.includes(role) && this.clientOrganisation) {
    throw new Error(
      "clientOrganisation should not be set for internal roles"
    );
  }
});

const ProjectMembership = mongoose.model<IProjectMembership>(
  "ProjectMembership",
  projectMembershipSchema
);

export default ProjectMembership;