import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

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