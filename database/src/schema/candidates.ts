import { pgTable, uuid, varchar, text, date, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const candidates = pgTable('candidates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  candidateCode: varchar('candidate_code', { length: 50 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  mobile: varchar('mobile', { length: 20 }).notNull(),
  alternateMobile: varchar('alternate_mobile', { length: 20 }),
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  pincode: varchar('pincode', { length: 10 }),
  aadhaarNumber: varchar('aadhaar_number', { length: 12 }),
  panNumber: varchar('pan_number', { length: 10 }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  source: varchar('source', { length: 100 }),
  appliedFor: varchar('applied_for', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
