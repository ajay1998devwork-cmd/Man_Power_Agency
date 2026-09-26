import { User } from './user';

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface TokenPayload {
  userId: string;
  tenantId?: string;
  role: string;
  email: string;
}

export interface RequestUser {
  userId: string;
  tenantId?: string;
  role: string;
  email: string;
}
