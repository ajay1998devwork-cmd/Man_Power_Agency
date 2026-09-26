import { pgTable, uuid, date, time, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { employees } from './employees';
import { locations } from './locations';

export const attendance = pgTable('attendance', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }),
  attendanceDate: date('attendance_date').notNull(),
  checkIn: time('check_in'),
  checkOut: time('check_out'),
  status: varchar('status', { length: 20 }).notNull().default('present'),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
