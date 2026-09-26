import { pgTable, uuid, varchar, date, decimal, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { employees } from './employees';
import { clients } from './clients';
import { locations } from './locations';
import { departments } from './departments';

export const employeeAssignments = pgTable('employee_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'cascade' }),
  designation: varchar('designation', { length: 255 }),
  joiningDate: date('joining_date').notNull(),
  releaseDate: date('release_date'),
  salary: decimal('salary', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
