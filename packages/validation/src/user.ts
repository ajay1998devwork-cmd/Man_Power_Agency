import { z } from 'zod';
import { emailSchema, statusSchema, uuidSchema } from './common';

export const userRoleSchema = z.enum(['super_admin', 'tenant_admin', 'manager', 'employee']);

export const createUserSchema = z.object({
  tenantId: uuidSchema.optional(),
  email: emailSchema,
  mobile: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: userRoleSchema,
});

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  mobile: z.string().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  status: statusSchema.optional(),
});
