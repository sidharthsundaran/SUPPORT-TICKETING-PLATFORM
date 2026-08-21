import { Router } from "express";
import { projectController } from "../controllers/project.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import platformAdminMiddleware from "../middleware/platform-admin.middleware.js";
import {
  requireProjectMember,
  requireProjectAdmin,
} from "../middleware/project.access.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/", platformAdminMiddleware, projectController.createProject);
router.get("/me", projectController.getMyProjects);
router.get("/:id", requireProjectMember, projectController.getProject);
router.patch("/:id", requireProjectAdmin, projectController.updateProject);

// Membership routes
router.get("/:id/members", requireProjectMember, projectController.getMembers);
router.post("/:id/members", requireProjectAdmin, projectController.addMember);
router.patch(
  "/members/:membershipId",
  requireProjectAdmin,
  projectController.updateMemberRole
);
router.delete(
  "/members/:membershipId",
  requireProjectAdmin,
  projectController.removeMember
);

router.get("/:id/pending-memberships", requireProjectAdmin, projectController.getPendingMemberships);
router.patch("/members/:membershipId/approve", requireProjectAdmin, projectController.approveMember);
router.patch("/members/:membershipId/reject", requireProjectAdmin, projectController.rejectMember);
router.patch("/members/:membershipId/deactivate", requireProjectAdmin, projectController.deactivateMember);
router.patch("/members/:membershipId/reactivate", requireProjectAdmin, projectController.reactivateMember);

export default router;
