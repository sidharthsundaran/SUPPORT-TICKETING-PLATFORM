import { BadRequestError, NotFoundError } from "../utils/app-error.js";
import User, { IUser, UserType } from "../models/user.js";
import Ticket from "../models/Ticket.js";
import AuditLog from "../models/AuditLog.js";
import ProjectMembership, { ProjectRole } from "../models/ProjectMembership.js";

export interface EnrichedAdminUser {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  isPlatformAdmin: boolean;
  isActive: boolean;
  tokenVersion: number;
  clientMembershipsCount: number;
  totalMembershipsCount: number;
  createdAt: Date;
}

export class AdminService {
  async getAllUsers(): Promise<EnrichedAdminUser[]> {
    const users = await User.find({}).sort({ createdAt: -1 });

    const clientRoles: ProjectRole[] = ["client_org_admin", "client_requester"];

    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const totalMembershipsCount = await ProjectMembership.countDocuments({
          userId: u._id,
        });

        const clientMembershipsCount = await ProjectMembership.countDocuments({
          userId: u._id,
          role: { $in: clientRoles },
        });

        return {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          userType: u.userType,
          isPlatformAdmin: u.isPlatformAdmin,
          isActive: u.isActive,
          tokenVersion: u.tokenVersion || 0,
          clientMembershipsCount,
          totalMembershipsCount,
          createdAt: u.createdAt,
        };
      })
    );

    return enrichedUsers;
  }

  async updateUserStatus(
    targetUserId: string,
    isActive: boolean,
    actor: IUser
  ): Promise<IUser> {
    if (targetUserId === actor._id.toString()) {
      throw new BadRequestError("You cannot deactivate your own admin account");
    }

    const user = await User.findById(targetUserId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    user.isActive = isActive;

    if (!isActive) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    await user.save();

    await AuditLog.create({
      action: "PLATFORM_ADMIN_USER_STATUS_CHANGE",
      actorId: actor._id,
      targetId: user._id,
      details: { newStatus: isActive ? "active" : "deactivated", tokenVersion: user.tokenVersion },
    });

    return user;
  }

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

    await AuditLog.create({
      action: "PLATFORM_ADMIN_USER_TYPE_CHANGE",
      actorId: actor._id,
      targetId: user._id,
      details: { newUserType: targetType },
    });

    return user;
  }

  async deleteClientOrgData(clientOrgName: string, actor: IUser): Promise<{ deletedTicketsCount: number }> {
    if (!clientOrgName || !clientOrgName.trim()) {
      throw new BadRequestError("Client organisation name is required");
    }

    const tickets = await Ticket.find({ clientOrganisation: clientOrgName.trim() });
    const count = tickets.length;

    await Ticket.deleteMany({ clientOrganisation: clientOrgName.trim() });

    await AuditLog.create({
      action: "CLIENT_ORG_DATA_PURGE",
      actorId: actor._id,
      details: { clientOrganisation: clientOrgName.trim(), deletedTicketsCount: count },
    });

    return { deletedTicketsCount: count };
  }
}

export const adminService = new AdminService();
