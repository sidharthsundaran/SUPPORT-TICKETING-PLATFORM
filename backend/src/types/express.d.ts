import { IUser } from "../models/user.js";
import { IProjectMembership } from "../models/ProjectMembership.js";
import { ITicket } from "../models/Ticket.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      projectMembership?: IProjectMembership | null;
      ticket?: ITicket | null;
    }
  }
}

export {};