
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error.js";

const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  console.error("Unhandled Error:", error);

  res.status(500).json({
    success: false,
    message: error.message || "Internal Server Error",
  });
};

export default errorMiddleware;