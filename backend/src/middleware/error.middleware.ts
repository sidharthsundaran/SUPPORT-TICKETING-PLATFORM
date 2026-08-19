import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error.js";

interface CastError extends Error {
  name: "CastError";
  path: string;
  value: unknown;
}

interface ValidationError extends Error {
  name: "ValidationError";
  errors: Record<string, { message: string }>;
}

interface MongoDuplicateKeyError extends Error {
  code: number;
  keyValue?: Record<string, unknown>;
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

const errorMiddleware = (
  error: unknown,
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

  if (isObject(error)) {
    if (error.name === "CastError") {
      const castErr = error as unknown as CastError;
      res.status(400).json({
        success: false,
        message: `Invalid ${castErr.path}: ${String(castErr.value)}`,
      });
      return;
    }

    if (error.name === "ValidationError" && isObject(error.errors)) {
      const validationErr = error as unknown as ValidationError;
      const messages = Object.values(validationErr.errors).map(
        (e) => e.message
      );
      res.status(400).json({
        success: false,
        message: `Validation Error: ${messages.join(", ")}`,
      });
      return;
    }

    if (error.code === 11000) {
      const dupErr = error as unknown as MongoDuplicateKeyError;
      const field = Object.keys(dupErr.keyValue || {})[0] || "field";
      res.status(409).json({
        success: false,
        message: `A record with that ${field} already exists`,
      });
      return;
    }
  }

  console.error("Unhandled Error:", error);

  const message =
    error instanceof Error ? error.message : "Internal Server Error";

  res.status(500).json({
    success: false,
    message,
  });
};

export default errorMiddleware;