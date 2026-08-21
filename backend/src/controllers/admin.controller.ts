import { Request, Response, NextFunction } from "express";
import { adminService, AdminService } from "../services/admin.service.js";
import { BadRequestError } from "../utils/app-error.js";

export class AdminController {
  constructor(private readonly service: AdminService = adminService) {}

  getUsers = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const users = await this.service.getAllUsers();
      res.status(200).json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = req.user;
      if (!actor) throw new BadRequestError("Authentication required");

      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        throw new BadRequestError("isActive (boolean) is required");
      }

      const updatedUser = await this.service.updateUserStatus(id, isActive, actor);

      res.status(200).json({
        success: true,
        message: `User account ${isActive ? "activated" : "deactivated"} successfully`,
        data: {
          user: {
            id: updatedUser._id.toString(),
            name: updatedUser.name,
            email: updatedUser.email,
            userType: updatedUser.userType,
            isActive: updatedUser.isActive,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  updateUserType = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = req.user;
      if (!actor) throw new BadRequestError("Authentication required");

      const { id } = req.params;
      const { userType } = req.body;

      if (!userType || !["internal", "client"].includes(userType)) {
        throw new BadRequestError("Valid userType ('internal' or 'client') is required");
      }

      const updatedUser = await this.service.updateUserType(id, userType, actor);

      res.status(200).json({
        success: true,
        message: `User account type changed to ${userType} successfully`,
        data: {
          user: {
            id: updatedUser._id.toString(),
            name: updatedUser.name,
            email: updatedUser.email,
            userType: updatedUser.userType,
            isActive: updatedUser.isActive,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  purgeClientOrgData = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = req.user;
      if (!actor) throw new BadRequestError("Authentication required");

      const { orgName } = req.params;
      const result = await this.service.deleteClientOrgData(orgName, actor);

      res.status(200).json({
        success: true,
        message: `Permanently deleted ${result.deletedTicketsCount} ticket(s) and associated data for client organisation '${orgName}'`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const adminController = new AdminController();
