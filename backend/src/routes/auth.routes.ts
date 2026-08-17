import { Router } from "express";
import { 
    register,
    login,
    getMe,
    refresh,
    logout,
    getUsers
} from "../controllers/auth.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post('/login', login);
router.get("/me", authMiddleware, getMe);
router.get("/users", authMiddleware, getUsers);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;

