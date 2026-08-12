import { Request, Response, NextFunction } from "express";
import {
  categoryService,
  CategoryService,
} from "../services/category.service.js";

export class CategoryController {
  constructor(
    private readonly service: CategoryService = categoryService
  ) {}

  createCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { projectId } = req.params;

      const category = await this.service.createCategory(
        projectId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  getCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { projectId } = req.params;

      const includeInactive =
        req.query.includeInactive === "true";

      const categories =
        await this.service.getProjectCategories(
          projectId,
          includeInactive
        );

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  };

  getCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { projectId, categoryId } = req.params;

      const category =
        await this.service.getCategoryById(
          projectId,
          categoryId
        );

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { projectId, categoryId } = req.params;

      const category =
        await this.service.updateCategory(
          projectId,
          categoryId,
          req.body
        );

      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  deactivateCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { projectId, categoryId } = req.params;

      const category =
        await this.service.deactivateCategory(
          projectId,
          categoryId
        );

      res.status(200).json({
        success: true,
        message: "Category deactivated successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };
}

 const categoryController = new CategoryController();
export const createCategory = categoryController.createCategory;
export const getCategories = categoryController.getCategories;
export const getCategory = categoryController.getCategory;
export const updateCategory = categoryController.updateCategory;
export const deactivateCategory =categoryController.deactivateCategory;