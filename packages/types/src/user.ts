import { Status, Timestamps } from './common';

export type UserRole = 'super_admin' | 'tenant_admin' | 'manager' | 'employee';

export interface User extends Timestamps {
  id: string;
  tenantId?: string;
  email: string;
  mobile?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: Status;
  lastLoginAt?: Date;
}

export interface CreateUserDto {
  tenantId?: string;
  email: string;
  mobile?: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserDto {
  email?: string;
  mobile?: string;
  firstName?: string;
  lastName?: string;
  status?: Status;
}
