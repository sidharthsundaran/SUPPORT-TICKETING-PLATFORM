import User, { IUser, UserType } from "../models/user.js";
import ProjectMembership, { ProjectRole } from "../models/ProjectMembership.js";
import { BadRequestError, NotFoundError } from "../utils/app-error.js";

export interface AdminUserListItem {
  _id: string;
  name: string;
  email: string;
  userType: UserType;
  isPlatformAdmin: boolean;
  isActive: boolean;
  clientMembershipsCount: number;
  totalMembershipsCount: number;
  createdAt: Date;
}

export class AdminService {
  /**
   * Fetch all users with enriched project membership counts
   */
  async getAllUsers(): Promise<AdminUserListItem[]> {
    const users = await User.find().sort({ createdAt: -1 });

    const enriched = await Promise.all(
      users.map(async (u) => {
        const memberships = await ProjectMembership.find({ userId: u._id });
        const clientMembershipsCount = memberships.filter((m) =>
          ["client_org_admin", "client_requester"].includes(m.role)
        ).length;

        return {
          _id: u._id.toString(),
          name: u.name,
          email: u.email,
          userType: u.userType,
          isPlatformAdmin: u.isPlatformAdmin,
          isActive: u.isActive,
          clientMembershipsCount,
          totalMembershipsCount: memberships.length,
          createdAt: u.createdAt,
        };
      })
    );

    return enriched;
  }

  /**
   * Toggle user active/inactive status with immediate session invalidation
   */
  async updateUserStatus(
    targetUserId: string,
    isActive: boolean,
    actor: IUser
  ): Promise<IUser> {
    const user = await User.findById(targetUserId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user._id.toString() === actor._id.toString()) {
      throw new BadRequestError("Platform Admins cannot deactivate their own account");
    }

    user.isActive = isActive;

    // Increment tokenVersion on deactivation to invalidate all active refresh tokens
    if (!isActive) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    await user.save();
    return user;
  }

  /**
   * Update userType (internal <-> client) with client membership guard
   */
  async updateUserType(
    targetUserId: string,
    targetType: UserType,
    actor: IUser
  ): Promise<IUser> {
    if (!["internal", "client"].includes(targetType)) {
      throw new BadRequestError("Invalid userType specified");
    }

    const user = await User.findById(targetUserId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.userType === targetType) {
      return user;
    }

    // Conversion Guard: Block client -> internal if user holds active client project memberships
    if (user.userType === "client" && targetType === "internal") {
      const clientRoles: ProjectRole[] = ["client_org_admin", "client_requester"];
      const clientMemberships = await ProjectMembership.find({
        userId: user._id,
        role: { $in: clientRoles },
      });

      if (clientMemberships.length > 0) {
        throw new BadRequestError(
          `Cannot convert user to internal staff while they hold ${clientMemberships.length} active client project membership(s). Please remove their client project memberships first.`
        );
      }
    }

    user.userType = targetType;
    await user.save();
    return user;
  }
}

export const adminService = new AdminService();
