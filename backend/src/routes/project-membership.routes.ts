import { Router } from "express";

import {
  projectMembershipController,
} from "../controllers/project.membership.controller";

import authMiddleware from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post(
  "/projects/:projectId/members",
  projectMembershipController.addMember
);

router.get(
  "/projects/:projectId/members",
  projectMembershipController.getProjectMembers
);

router.get(
  "/users/:userId/memberships",
  projectMembershipController.getUserMemberships
);

router.patch(
  "/projects/:projectId/members/:userId",
  projectMembershipController.updateMember
);

router.delete(
  "/projects/:projectId/members/:userId",
  projectMembershipController.removeMember
);

export default router;
