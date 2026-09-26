import { pgTable, uuid, varchar, text, date, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { candidates } from './candidates';
import { users } from './users';

export const employees = pgTable('employees', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  candidateId: uuid('candidate_id').references(() => candidates.id),
  userId: uuid('user_id').references(() => users.id),
  employeeCode: varchar('employee_code', { length: 50 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  mobile: varchar('mobile', { length: 20 }).notNull(),
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  pincode: varchar('pincode', { length: 10 }),
  aadhaarNumber: varchar('aadhaar_number', { length: 12 }),
  panNumber: varchar('pan_number', { length: 10 }),
  bankAccountNumber: varchar('bank_account_number', { length: 50 }),
  bankName: varchar('bank_name', { length: 255 }),
  bankIfsc: varchar('bank_ifsc', { length: 11 }),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  joiningDate: date('joining_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
