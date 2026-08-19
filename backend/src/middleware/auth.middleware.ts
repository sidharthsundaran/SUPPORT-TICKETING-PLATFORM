import { Request, Response, NextFunction } from "express";
import { userRepository } from "../repositories/user.repository.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { UnauthorizedError, ForbiddenError } from "../utils/app-error.js";

const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next(new UnauthorizedError("Authentication required"));
      return;
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      next(new UnauthorizedError("Invalid authorization header"));
      return;
    }

    const payload = verifyAccessToken(token);

    const user = await userRepository.findById(payload.userId);

    if (!user) {
      next(new UnauthorizedError("User not found"));
      return;
    }

    if (!user.isActive) {
      next(new ForbiddenError("Account is inactive"));
      return;
    }

    if (
      payload.tokenVersion !== undefined &&
      payload.tokenVersion !== (user.tokenVersion || 0)
    ) {
      next(new UnauthorizedError("Session invalidated. Please log in again."));
      return;
    }

    req.user = user;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
};

export default authMiddleware;