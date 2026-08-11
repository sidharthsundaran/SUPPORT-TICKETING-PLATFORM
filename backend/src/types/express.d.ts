import { IUser } from "../models/user.js";
import { IProjectMembership } from "../models/ProjectMembership.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      projectMembership?: IProjectMembership | null;
    }
  }
}

export {};