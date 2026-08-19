import mongoose, { Document, Schema, Types } from "mongoose";

export interface ProjectConfigItem {
  name: string;
  isActive: boolean;
}

export interface IProject extends Document {
  name: string;
  code: string;
  description?: string;
  ownerId: Types.ObjectId;
  status: "active" | "inactive";
  isActive: boolean;

  issueTypes: ProjectConfigItem[];
  modules: ProjectConfigItem[];

  applicationUrls?: {
    production?: string;
    uat?: string;
    development?: string;
  };

  allowedEmailDomains?: string[];

  branding?: {
    logo?: string;
    accentColor?: string;
    displayName?: string;
  };

  evidenceConfig?: {
    maxFiles: number;
    maxFileSizeMb: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const projectConfigItemSchema = new Schema<ProjectConfigItem>(
  {
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
      minlength: 2,
      maxlength: 10,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    issueTypes: [projectConfigItemSchema],
    modules: [projectConfigItemSchema],

    applicationUrls: {
      production: { type: String, trim: true },
      uat: { type: String, trim: true },
      development: { type: String, trim: true },
    },

    allowedEmailDomains: [{ type: String, trim: true, lowercase: true }],

    branding: {
      logo: String,
      accentColor: String,
      displayName: String,
    },

    evidenceConfig: {
      maxFiles: { type: Number, default: 5 },
      maxFileSizeMb: { type: Number, default: 25 },
    },
  },
  {
    timestamps: true,
  }
);

// Synchronize status and isActive before saving
projectSchema.pre("save", function () {
  if (this.isModified("status")) {
    this.isActive = this.status === "active";
  } else if (this.isModified("isActive")) {
    this.status = this.isActive ? "active" : "inactive";
  }
});

const Project = mongoose.model<IProject>("Project", projectSchema);

export default Project;