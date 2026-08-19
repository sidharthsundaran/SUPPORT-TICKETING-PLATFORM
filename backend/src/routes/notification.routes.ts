import { Router } from "express";
import { notificationController } from "../controllers/notification.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

// Protect all notification routes
router.use(authMiddleware);

router.get("/my", notificationController.getMyNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);

export default router;
