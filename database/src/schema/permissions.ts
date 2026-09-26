import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { roles } from './roles';

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
