import Project , {IProject} from "../models/Project";

export interface CreateProjectData {
  name: string;
  description?: string ;
  ownerId:string;
}

export class ProjectRepository{
  async create(data:CreateProjectData):Promise<IProject>{
      return Project.create({
        name: data.name.trim(),
        description : data.description?.trim(),
        ownerId: data.ownerId.trim()
      })
  }

  async findById(id:string):Promise<IProject |null>{
    return Project.findById(id)
  }

  async findAll():Promise<IProject[]>{
    return Project.find().sort({createdAt:-1})
  }

  async findActive(): Promise<IProject[]>{
    return Project.find({isActive:true}).sort({createdAt:-1})
  }

  async updateById(
    id:string,
    updateData:Partial<IProject>,
  ):Promise<IProject |null>{
    return Project.findByIdAndUpdate(id
      ,
      updateData,
      {
        new :true,
        runValidators :true
      }
    )
  }
  async deleteById(id:string):Promise<IProject | null>{
    return  Project.findByIdAndDelete(
      id,
      {
        new :true,
        runValidators:true
      }
    )
  }

}


export const projectRepository =  new ProjectRepository()