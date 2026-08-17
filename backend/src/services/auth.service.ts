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

    const accessToken = generateAccessToken({ userId: user._id.toString() });
    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        userType: user.userType,
        isPlatformAdmin: user.isPlatformAdmin,
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

    const accessToken = generateAccessToken({ userId: user._id.toString() });
    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        userType: user.userType,
        isPlatformAdmin: user.isPlatformAdmin,
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
      },
    };
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

    const newAccessToken = generateAccessToken({ userId: user._id.toString() });
    const newRefreshToken = generateRefreshToken({ userId: user._id.toString() });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        userType: user.userType,
        isPlatformAdmin: user.isPlatformAdmin,
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