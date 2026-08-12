import { Router } from "express";
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deactivateCategory,
} from "../controllers/category.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  requireProjectMember,
  requireProjectAdmin,
} from "../middleware/project.access.middleware.js";

const router = Router();

// Apply auth check to all category routes
router.use(authMiddleware);

// Category collection routes
router
  .route("/:projectId/categories")
  .post(requireProjectAdmin, createCategory)
  .get(requireProjectMember, getCategories);

// Individual category routes
router
  .route("/:projectId/categories/:categoryId")
  .get(requireProjectMember, getCategory)
  .patch(requireProjectAdmin, updateCategory)
  .delete(requireProjectAdmin, deactivateCategory);

export default router;