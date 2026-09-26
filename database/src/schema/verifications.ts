import { pgTable, uuid, varchar, text, date, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { candidates } from './candidates';

export const verifications = pgTable('verifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  candidateId: uuid('candidate_id').references(() => candidates.id, { onDelete: 'cascade' }).notNull(),
  verificationType: varchar('verification_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  verifiedBy: varchar('verified_by', { length: 255 }),
  verificationDate: date('verification_date'),
  remarks: text('remarks'),
  documentUrl: varchar('document_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
