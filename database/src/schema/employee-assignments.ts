import { pgTable, uuid, varchar, text, date, numeric, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { employees } from './employees';
import { companies } from './companies';

/**
 * employment_history
 * ─────────────────
 * Each row = one placement of an employee at a company.
 * An employee can have many rows (transfers / re-placements).
 * Only ONE row should have status='active' at any time per employee.
 *
 * Lifecycle:
 *  onboarding  → agency filling joining details
 *  active      → employee is currently placed at this company
 *  exited      → employee has left this company (relieved / absconded / terminated)
 */
export const employmentHistory = pgTable('employment_history', {
  id:                  uuid('id').defaultRandom().primaryKey(),
  tenantId:            uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  employeeId:          uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  companyId:           uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),

  // Agency code is on the employees table — NEVER changes.
  // Company gives the employee their own internal code; agency records it here.
  companyEmployeeCode: varchar('company_employee_code', { length: 100 }),

  designation:         varchar('designation', { length: 150 }),
  department:          varchar('department', { length: 150 }),
  workLocation:        varchar('work_location', { length: 255 }),

  joiningDate:         date('joining_date').notNull(),
  exitDate:            date('exit_date'),

  // Monthly CTC / salary agreed for this placement
  salary:              numeric('salary', { precision: 10, scale: 2 }),
  salaryBreakdown:     text('salary_breakdown'), // free-text note e.g. "Basic 8k + HRA 2k"

  status:              varchar('status', { length: 30 }).notNull().default('onboarding'),
  // onboarding | active | exited

  exitReason:          varchar('exit_reason', { length: 50 }),
  // resigned | terminated | absconded | contract_ended | transfer | other

  exitRemarks:         text('exit_remarks'), // agency notes on exit

  // Interview that led to this placement (for traceability)
  interviewId:         uuid('interview_id'),

  createdAt:           timestamp('created_at').defaultNow().notNull(),
  updatedAt:           timestamp('updated_at').defaultNow().notNull(),
});
