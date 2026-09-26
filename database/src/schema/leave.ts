import { pgTable, uuid, date, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { employees } from './employees';
import { users } from './users';

export const leave = pgTable('leave', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  leaveType: varchar('leave_type', { length: 50 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  reason: text('reason'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
