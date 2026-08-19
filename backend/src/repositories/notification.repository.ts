import Notification, { INotification, NotificationType } from "../models/Notification.js";

export interface CreateNotificationData {
  recipientId: string;
  ticketId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
}

export class NotificationRepository {
  async create(data: CreateNotificationData): Promise<INotification> {
    return Notification.create(data);
  }

  async createMany(items: CreateNotificationData[]): Promise<INotification[]> {
    if (!items || items.length === 0) return [];
    const created = await Notification.insertMany(items);
    return created as unknown as INotification[];
  }

  async findByRecipient(
    recipientId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: INotification[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ recipientId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Notification.countDocuments({ recipientId }),
    ]);

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async countUnread(recipientId: string): Promise<number> {
    return Notification.countDocuments({ recipientId, isRead: false });
  }

  async markAsRead(notificationId: string, recipientId: string): Promise<INotification | null> {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipientId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  async markAllAsRead(recipientId: string): Promise<void> {
    await Notification.updateMany(
      { recipientId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }
}

export const notificationRepository = new NotificationRepository();
