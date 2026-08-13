export type UserType = "internal" | "client";

export interface IUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  userType: UserType;
  isPlatformAdmin: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
