import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { candidates } from './candidates';
import { users } from './users';

export const interviews = pgTable('interviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  candidateId: uuid('candidate_id').references(() => candidates.id, { onDelete: 'cascade' }).notNull(),
  interviewerId: uuid('interviewer_id').references(() => users.id),
  scheduledAt: timestamp('scheduled_at').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('scheduled'),
  result: varchar('result', { length: 20 }),
  notes: text('notes'),
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
