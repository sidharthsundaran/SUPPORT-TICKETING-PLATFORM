import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";
import type { CookieOptions } from "express";

const getAccessTokenSecret = (): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET is not defined in environment variables");
  }
  return secret;
};

const getRefreshTokenSecret = (): string => {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) {
    throw new Error("REFRESH_TOKEN_SECRET is not defined in environment variables");
  }
  return secret;
};

export const REFRESH_COOKIE_NAME = "refreshToken";

export const getRefreshCookieOptions = (): CookieOptions => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};

export const authConfig = {
  get accessTokenSecret(): string {
    return getAccessTokenSecret();
  },
  get refreshTokenSecret(): string {
    return getRefreshTokenSecret();
  },

  accessTokenExpiresIn: "15m" as SignOptions["expiresIn"],
  refreshTokenExpiresIn: "7d" as SignOptions["expiresIn"],
};