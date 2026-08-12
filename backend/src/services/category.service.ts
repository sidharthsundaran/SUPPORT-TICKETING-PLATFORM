import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../utils/app-error.js";

import {
  categoryRepository,
  CategoryRepository,
} from "../repositories/category.repository.js";

import {
  projectRepository,
  ProjectRepository,
} from "../repositories/project.repository.js";

import { ICategory } from "../models/category.js";

export interface CreateCategoryDTO {
  name: string;
  description?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
}

export class CategoryService {
  constructor(
    private readonly categoryRepo: CategoryRepository = categoryRepository,
    private readonly projectRepo: ProjectRepository = projectRepository
  ) {}

  async createCategory(
    projectId: string,
    dto: CreateCategoryDTO
  ): Promise<ICategory> {
    const project = await this.projectRepo.findById(projectId);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (!project.isActive) {
      throw new BadRequestError("Project is inactive");
    }

    const name = dto.name?.trim();

    if (!name || name.length < 2 || name.length > 100) {
      throw new BadRequestError(
        "Category name must be between 2 and 100 characters long"
      );
    }

    const description = dto.description?.trim();
    if (description && description.length > 500) {
      throw new BadRequestError(
        "Category description cannot exceed 500 characters"
      );
    }

    const existing = await this.categoryRepo.findByProjectAndName(
      projectId,
      name
    );

    if (existing) {
      throw new ConflictError(
        "A category with this name already exists in this project"
      );
    }

    return this.categoryRepo.create({
      projectId,
      name,
      description,
    });
  }

  async getProjectCategories(
    projectId: string,
    includeInactive = false
  ): Promise<ICategory[]> {
    const project = await this.projectRepo.findById(projectId);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    return this.categoryRepo.findByProject(
      projectId,
      includeInactive
    );
  }

  async getCategoryById(
    projectId: string,
    categoryId: string
  ): Promise<ICategory> {
    const category = await this.categoryRepo.findById(categoryId);

    if (!category || category.projectId.toString() !== projectId) {
      throw new NotFoundError("Category not found");
    }

    return category;
  }

  async updateCategory(
    projectId: string,
    categoryId: string,
    dto: UpdateCategoryDTO
  ): Promise<ICategory> {
    const category = await this.getCategoryById(
      projectId,
      categoryId
    );

    const updateData: UpdateCategoryDTO = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      if (name.length < 2 || name.length > 100) {
        throw new BadRequestError(
          "Category name must be between 2 and 100 characters long"
        );
      }

      if (name !== category.name) {
        const existing =
          await this.categoryRepo.findByProjectAndName(
            projectId,
            name
          );

        if (existing) {
          throw new ConflictError(
            "A category with this name already exists in this project"
          );
        }
      }

      updateData.name = name;
    }

    if (dto.description !== undefined) {
      const description = dto.description.trim();

      if (description.length > 500) {
        throw new BadRequestError(
          "Category description cannot exceed 500 characters"
        );
      }

      updateData.description = description;
    }

    if (Object.keys(updateData).length === 0) {
      return category;
    }

    const updated = await this.categoryRepo.updateById(
      categoryId,
      updateData
    );

    if (!updated) {
      throw new NotFoundError("Category not found");
    }

    return updated;
  }

  async deactivateCategory(
    projectId: string,
    categoryId: string
  ): Promise<ICategory> {
    await this.getCategoryById(projectId, categoryId);

    const category = await this.categoryRepo.deactivate(categoryId);

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    return category;
  }
}

export const categoryService = new CategoryService();