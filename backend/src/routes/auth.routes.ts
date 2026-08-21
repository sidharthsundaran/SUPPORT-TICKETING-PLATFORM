import { Router } from "express";
import { 
    register,
    login,
    getMe,
    refresh,
    logout,
    getUsers,
    sendVerification,
    verifyEmail
} from "../controllers/auth.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import { registerRateLimiter, loginRateLimiter } from "../middleware/rate-limit.middleware.js";

const router = Router();

router.post("/register", registerRateLimiter, register);
router.post('/login', loginRateLimiter, login);
router.get("/me", authMiddleware, getMe);
router.get("/users", authMiddleware, getUsers);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/send-verification", authMiddleware, sendVerification);
router.post("/verify-email", authMiddleware, verifyEmail);

export default router;

