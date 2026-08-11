import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth.js";

export interface AccessTokenPayload {
  userId: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

export const generateAccessToken = (
  payload: AccessTokenPayload
): string => {
  return jwt.sign(
    payload,
    authConfig.accessTokenSecret,
    {
      expiresIn: authConfig.accessTokenExpiresIn,
    }
  );
};

export const generateRefreshToken = (
  payload: RefreshTokenPayload
): string => {
  return jwt.sign(
    payload,
    authConfig.refreshTokenSecret,
    {
      expiresIn: authConfig.refreshTokenExpiresIn,
    }
  );
};

export const verifyAccessToken = (
  token: string
): AccessTokenPayload => {
  return jwt.verify(
    token,
    authConfig.accessTokenSecret
  ) as AccessTokenPayload;
};

export const verifyRefreshToken = (
  token: string
): RefreshTokenPayload => {
  return jwt.verify(
    token,
    authConfig.refreshTokenSecret
  ) as RefreshTokenPayload;
};