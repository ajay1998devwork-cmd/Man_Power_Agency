import { pgTable, uuid, varchar, date, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { candidates } from './candidates';
import { companies } from './companies';

/**
 * employees
 * ─────────
 * Created when an interview result is marked "passed" and the agency
 * officially onboards the worker.
 *
 * Agency-generated employeeCode NEVER changes — even when the employee
 * moves between companies.  Personal details (name, Aadhaar, bank) live
 * on the candidates table; we just FK into it.
 *
 * status:
 *  active     — currently placed at a company
 *  benched    — between placements (left previous, not yet placed again)
 *  inactive   — left the agency / not available
 */
export const employees = pgTable('employees', {
  id:                uuid('id').defaultRandom().primaryKey(),
  tenantId:          uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),

  // Source candidate record — personal info lives here
  candidateId:       uuid('candidate_id').references(() => candidates.id).notNull(),

  // Permanent, agency-assigned code e.g. "SKYLINE-042"  (never changes)
  agencyEmployeeCode: varchar('agency_employee_code', { length: 50 }).notNull(),

  // Denormalised quick-lookup: which company is this person at right now?
  currentCompanyId:  uuid('current_company_id').references(() => companies.id),

  // overall employee status
  status:            varchar('status', { length: 20 }).notNull().default('active'),
  // active | benched | inactive

  // Date they first joined any company via this agency
  firstJoiningDate:  date('first_joining_date'),

  createdAt:         timestamp('created_at').defaultNow().notNull(),
  updatedAt:         timestamp('updated_at').defaultNow().notNull(),
});
