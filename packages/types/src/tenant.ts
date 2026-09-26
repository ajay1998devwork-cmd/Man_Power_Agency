import { Status, Timestamps } from './common';

export interface Tenant extends Timestamps {
  id: string;
  name: string;
  code: string;
  status: Status;
  subscriptionPlan?: string;
  subscriptionStatus?: 'active' | 'expired' | 'trial';
  subscriptionExpiresAt?: Date;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  settings?: Record<string, unknown>;
}

export interface CreateTenantDto {
  name: string;
  code: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
}

export interface UpdateTenantDto {
  name?: string;
  status?: Status;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  settings?: Record<string, unknown>;
}
