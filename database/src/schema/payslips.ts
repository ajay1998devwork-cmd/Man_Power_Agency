import { pgTable, uuid, varchar, decimal, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { employees } from './employees';
import { payroll } from './payroll';

export const payslips = pgTable('payslips', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  payrollId: uuid('payroll_id').references(() => payroll.id, { onDelete: 'cascade' }).notNull(),
  payslipNumber: varchar('payslip_number', { length: 50 }).notNull().unique(),
  grossSalary: decimal('gross_salary', { precision: 10, scale: 2 }).notNull(),
  netSalary: decimal('net_salary', { precision: 10, scale: 2 }).notNull(),
  breakdown: jsonb('breakdown'),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
