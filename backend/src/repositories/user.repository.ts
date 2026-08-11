import User, { IUser, UserType } from "../models/user.js";

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  userType: UserType;
  isPlatformAdmin?: boolean;
  isActive?: boolean;
}

export class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase().trim() });
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async create(userData: CreateUserData): Promise<IUser> {
    return User.create({
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
      userType: userData.userType,
      isPlatformAdmin: userData.isPlatformAdmin ?? false,
      isActive: userData.isActive ?? true,
    });
  }

  async updateById(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }
}

export const userRepository = new UserRepository();
