import TicketActivity, {
  ITicketActivity,
  TicketActivityAction,
} from "../models/TicketActivity.js";

export interface CreateActivityData {
  ticketId: string;
  actorId: string;
  action: TicketActivityAction;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
}

export class TicketActivityRepository {
  async create(data: CreateActivityData): Promise<ITicketActivity> {
    return TicketActivity.create(data);
  }

  async findByTicketId(ticketId: string): Promise<ITicketActivity[]> {
    return TicketActivity.find({ ticketId })
      .populate("actorId", "name email userType")
      .sort({ createdAt: -1 })
      .exec();
  }
}

export const ticketActivityRepository = new TicketActivityRepository();
