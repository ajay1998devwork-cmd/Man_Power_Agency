import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

/** A contractor/client company managed by an agency tenant. */
export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  registrationNumber: varchar('registration_number', { length: 100 }),
  industry: varchar('industry', { length: 100 }),
  primaryContactName: varchar('primary_contact_name', { length: 255 }).notNull(),
  primaryContactEmail: varchar('primary_contact_email', { length: 255 }),
  primaryContactPhone: varchar('primary_contact_phone', { length: 20 }).notNull(),
  hrContactName: varchar('hr_contact_name', { length: 255 }),
  hrContactPhone: varchar('hr_contact_phone', { length: 20 }),
  hrContactEmail: varchar('hr_contact_email', { length: 255 }),
  addressLine1: varchar('address_line_1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line_2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  pincode: varchar('pincode', { length: 10 }).notNull(),
  country: varchar('country', { length: 100 }).notNull().default('India'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
