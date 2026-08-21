import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Custom rate limiting middleware to prevent brute-force attacks and registration spam (BR-SEC-008).
 * @param windowMs Time window in milliseconds.
 * @param maxMax Maximum requests allowed within the window per IP.
 * @param message Error message returned upon breach.
 */
export function createRateLimiter(windowMs: number, maxMax: number, message: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `${req.path}:${ip}`;

    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (record.count >= maxMax) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.status(429).json({
        success: false,
        message: `${message} Please try again in ${retryAfterSeconds} seconds.`,
        retryAfterSeconds,
      });
      return;
    }

    record.count += 1;
    rateLimitStore.set(key, record);
    return next();
  };
}

// BR-SEC-008: Registration rate limiter (max 5 per 15 mins)
export const registerRateLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  "Too many accounts created from this IP."
);

// BR-SEC-008: Login rate limiter (max 10 per 15 mins)
export const loginRateLimiter = createRateLimiter(
  15 * 60 * 1000,
  10,
  "Too many login attempts."
);
