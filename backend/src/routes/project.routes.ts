import { Router } from "express";
import { projectController } from "../controllers/project.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import platformAdminMiddleware from "../middleware/platform-admin.middleware.js";


const router = Router();

router.use(authMiddleware);

router.post("/",platformAdminMiddleware, projectController.createProject);
router.get("/me", projectController.getMyProjects);
router.get("/:id", projectController.getProject);

router.get("/:id/members", projectController.getMembers);
router.post("/:id/members", projectController.addMember);
router.patch("/members/:membershipId",platformAdminMiddleware, projectController.updateMemberRole);
router.delete("/members/:membershipId",platformAdminMiddleware, projectController.removeMember);

export default router;
