import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import platformAdminMiddleware from "../middleware/platform-admin.middleware.js";
import { adminController } from "../controllers/admin.controller.js";

const router = Router();

// Protect all admin endpoints with auth + platformAdminMiddleware
router.use(authMiddleware, platformAdminMiddleware);

router.get("/users", adminController.getUsers);
router.patch("/users/:id/status", adminController.updateStatus);
router.patch("/users/:id/user-type", adminController.updateUserType);
router.delete("/organisations/:orgName/data", adminController.purgeClientOrgData);

export default router;
