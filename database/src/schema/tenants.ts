import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  subscriptionPlan: varchar('subscription_plan', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  contactEmail: varchar('contact_email', { length: 255 }).notNull(),
  contactPhone: varchar('contact_phone', { length: 20 }),
  address: text('address'),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
