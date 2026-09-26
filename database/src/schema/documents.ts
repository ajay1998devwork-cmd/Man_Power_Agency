import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { employees } from './employees';
import { candidates } from './candidates';
import { users } from './users';

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }),
  candidateId: uuid('candidate_id').references(() => candidates.id, { onDelete: 'cascade' }),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  documentName: varchar('document_name', { length: 255 }).notNull(),
  storageKey: varchar('storage_key', { length: 500 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  fileSize: varchar('file_size', { length: 20 }),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  verificationStatus: varchar('verification_status', { length: 20 }).default('pending'),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
