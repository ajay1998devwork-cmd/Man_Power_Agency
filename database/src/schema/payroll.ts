import { pgTable, uuid, varchar, decimal, integer, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { employees } from './employees';

export const payroll = pgTable('payroll', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  basicSalary: decimal('basic_salary', { precision: 10, scale: 2 }).notNull(),
  allowances: decimal('allowances', { precision: 10, scale: 2 }).default('0'),
  deductions: decimal('deductions', { precision: 10, scale: 2 }).default('0'),
  netSalary: decimal('net_salary', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
