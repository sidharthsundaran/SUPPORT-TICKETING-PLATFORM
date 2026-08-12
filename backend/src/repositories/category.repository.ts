import Category, { ICategory } from "../models/category";

export interface CreateCategoryData {
  projectId: string;
  name: string;
  description?: string;
}

export class CategoryRepository {
  async create(data: CreateCategoryData): Promise<ICategory> {
    return Category.create({
      projectId: data.projectId,
      name: data.name.trim(),
      description: data.description?.trim(),
    });
  }

  async findById(id: string): Promise<ICategory | null> {
    return Category.findById(id);
  }

  async findByProject(
    projectId: string,
    includeInactive = false
  ): Promise<ICategory[]> {
    const filter: {
      projectId: string;
      isActive?: boolean;
    } = { projectId };

    if (!includeInactive) {
      filter.isActive = true;
    }

    return Category.find(filter).sort({ name: 1 });
  }

  async findByProjectAndName(
    projectId: string,
    name: string
  ): Promise<ICategory | null> {
    return Category.findOne({
      projectId,
      name: name.trim(),
    });
  }

  async updateById(
    id: string,
    updateData: Partial<ICategory>
  ): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );
  }

  async deactivate(id: string): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(
      id,
      { isActive: false },
      {
        new: true,
        runValidators: true,
      }
    );
  }
}

export const categoryRepository = new CategoryRepository();