import { Router } from "express";
import { reportingController } from "../controllers/reporting.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/dashboard", reportingController.getDashboardMetrics);
router.get("/export", reportingController.exportCsv);

export default router;
