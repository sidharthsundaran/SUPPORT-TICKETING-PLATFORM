import { UserType, IUser } from '../../types/user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  userType: UserType;
}

export interface AuthResponseData {
  user: IUser;
  accessToken: string;
}
