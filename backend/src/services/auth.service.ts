import bcrypt from "bcryptjs";
import { userRepository, UserRepository } from "../repositories/user.repository.js";
import { UserType, IUser } from "../models/user.js";
import { generateAccessToken, generateRefreshToken ,verifyRefreshToken} from "../utils/jwt.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from "../utils/app-error.js";

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export interface RegisterDTO {
  name?: string;
  email?: string;
  password?: string;
  userType?: UserType;
}

export interface LoginDTO {
  email?: string;
  password?: string;
}

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    userType: UserType;
    isPlatformAdmin: boolean;
    isActive?: boolean;
    isEmailVerified?: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  constructor(private readonly userRepo: UserRepository = userRepository) {}

  async register(dto: RegisterDTO): Promise<AuthResult> {
    const { name, email, password, userType } = dto;

    if (!name || !email || !password || !userType) {
      throw new BadRequestError("Name, email, password and userType are required");
    }

    if (!["internal", "client"].includes(userType)) {
      throw new BadRequestError("Invalid userType");
    }

    if (password.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters");
    }

    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("A user with this email already exists");
    }

    const hashedPassword = await hashPassword(password);

    const user = await this.userRepo.create({
      name,
      email,
      password: hashedPassword,
      userType,
    });

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      tokenVersion: user.tokenVersion || 0,
    });
    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      tokenVersion: user.tokenVersion || 0,
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        userType: user.userType,
        isPlatformAdmin: user.isPlatformAdmin,
        isActive: user.isActive,
        isEmailVerified: Boolean(user.isEmailVerified),
      },
      accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginDTO): Promise<AuthResult> {
    const { email, password } = dto;

    if (!email || !password) {
      throw new BadRequestError("Email and password are required");
    }

    const user = await this.userRepo.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (!user.isActive) {
      throw new ForbiddenError("Account is inactive");
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      tokenVersion: user.tokenVersion || 0,
    });
    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      tokenVersion: user.tokenVersion || 0,
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        userType: user.userType,
        isPlatformAdmin: user.isPlatformAdmin,
        isActive: user.isActive,
        isEmailVerified: Boolean(user.isEmailVerified),
      },
      accessToken,
      refreshToken,
    };
  }

  async getUserProfile(user: IUser) {
    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        userType: user.userType,
        isPlatformAdmin: user.isPlatformAdmin,
        isActive: user.isActive,
        isEmailVerified: Boolean(user.isEmailVerified),
      },
    };
  }

  async sendVerificationCode(user: IUser): Promise<{ message: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.emailVerificationCode = code;
    user.emailVerificationExpires = expires;
    await user.save();

    const { emailService } = await import("./email.service.js");
    await emailService.sendEmail({
      to: user.email,
      subject: "[Action Required] Verify Your Email - Support Platform",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc;">
          <h2 style="color: #4f46e5;">Email Verification Code</h2>
          <p>Hello ${user.name},</p>
          <p>Your 6-digit email verification code for the Support Platform is:</p>
          <div style="font-size: 28px; font-weight: bold; color: #4f46e5; letter-spacing: 4px; margin: 16px 0;">${code}</div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you did not request this code, you can safely ignore this email.</p>
        </div>
      `,
    });

    return { message: `Verification code sent to ${user.email}` };
  }

  async verifyEmailCode(user: IUser, code: string): Promise<{ success: boolean; message: string }> {
    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      throw new BadRequestError("No verification code requested. Please click Resend Code.");
    }

    if (new Date() > user.emailVerificationExpires) {
      throw new BadRequestError("Verification code has expired. Please request a new code.");
    }

    if (user.emailVerificationCode.trim() !== code.trim()) {
      throw new BadRequestError("Invalid 6-digit verification code.");
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return { success: true, message: "Email verified successfully!" };
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthResult> {
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token required");
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const user = await this.userRepo.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    if (!user.isActive) {
      throw new ForbiddenError("Account is inactive");
    }

    if (
      payload.tokenVersion !== undefined &&
      payload.tokenVersion !== (user.tokenVersion || 0)
    ) {
      throw new UnauthorizedError("Session invalidated. Please log in again.");
    }

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      tokenVersion: user.tokenVersion || 0,
    });
    const newRefreshToken = generateRefreshToken({
      userId: user._id.toString(),
      tokenVersion: user.tokenVersion || 0,
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        userType: user.userType,
        isPlatformAdmin: user.isPlatformAdmin,
        isActive: user.isActive,
        isEmailVerified: Boolean(user.isEmailVerified),
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async getAllUsers() {
    const users = await this.userRepo.findAll();
    return users.map((u) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      userType: u.userType,
      isPlatformAdmin: u.isPlatformAdmin,
    }));
  }
}

export const authService = new AuthService();