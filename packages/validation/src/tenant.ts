import { z } from 'zod';
import { emailSchema, statusSchema } from './common';

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  code: z
    .string()
    .min(2, 'Tenant code must be at least 2 characters')
    .max(20, 'Tenant code must be at most 20 characters')
    .regex(/^[a-z0-9-]+$/, 'Tenant code must contain only lowercase letters, numbers, and hyphens'),
  contactEmail: emailSchema,
  contactPhone: z.string().optional(),
  address: z.string().optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  status: statusSchema.optional(),
  contactEmail: emailSchema.optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});
