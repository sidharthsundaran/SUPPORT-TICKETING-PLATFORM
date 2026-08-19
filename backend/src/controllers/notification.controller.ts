import { Request, Response, NextFunction } from "express";
import { notificationRepository } from "../repositories/notification.repository.js";
import { BadRequestError, NotFoundError } from "../utils/app-error.js";

export class NotificationController {
  getMyNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      if (!userId) {
        throw new BadRequestError("User ID not found in token");
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const result = await notificationRepository.findByRecipient(userId.toString(), page, limit);

      res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: {
          total: result.total,
          page: result.page,
          limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/notifications/unread-count
  getUnreadCount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      if (!userId) {
        throw new BadRequestError("User ID not found in token");
      }

      const unreadCount = await notificationRepository.countUnread(userId.toString());

      res.status(200).json({
        success: true,
        data: { unreadCount },
      });
    } catch (error) {
      next(error);
    }
  };

  // PATCH /api/notifications/:id/read
  markAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const notificationId = req.params.id;

      if (!userId) {
        throw new BadRequestError("User ID not found in token");
      }

      const updated = await notificationRepository.markAsRead(
        notificationId,
        userId.toString()
      );

      if (!updated) {
        throw new NotFoundError("Notification not found");
      }

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  // PATCH /api/notifications/read-all
  markAllAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      if (!userId) {
        throw new BadRequestError("User ID not found in token");
      }

      await notificationRepository.markAllAsRead(userId.toString());

      res.status(200).json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      next(error);
    }
  };
}

export const notificationController = new NotificationController();
