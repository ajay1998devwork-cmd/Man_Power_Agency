import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { candidates } from './candidates';
import { companies } from './companies';

export const interviews = pgTable('interviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  candidateId: uuid('candidate_id').references(() => candidates.id, { onDelete: 'cascade' }).notNull(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  interviewerName: varchar('interviewer_name', { length: 255 }).notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  mode: varchar('mode', { length: 30 }).notNull().default('in_person'),
  location: varchar('location', { length: 255 }),
  status: varchar('status', { length: 30 }).notNull().default('scheduled'),
  result: varchar('result', { length: 30 }),
  notes: text('notes'),
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
