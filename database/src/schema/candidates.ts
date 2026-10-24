import { pgTable, uuid, varchar, text, date, timestamp, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const candidateSequences = pgTable('candidate_sequences', {
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).primaryKey(),
  nextNumber: integer('next_number').notNull().default(1),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const candidates = pgTable('candidates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  candidateCode: varchar('candidate_code', { length: 50 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  fatherName: varchar('father_name', { length: 255 }).notNull(),
  aadhaarEncrypted: text('aadhaar_encrypted').notNull(),
  aadhaarLast4: varchar('aadhaar_last4', { length: 4 }).notNull(),
  mobile: varchar('mobile', { length: 20 }).notNull(),
  alternateMobile: varchar('alternate_mobile', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }),
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender', { length: 30 }),
  designation: varchar('designation', { length: 150 }).notNull(),
  experience: varchar('experience', { length: 100 }),
  currentAddress: text('current_address').notNull(),
  permanentAddress: text('permanent_address').notNull(),
  status: varchar('status', { length: 30 }).notNull().default('onboarding'),
  source: varchar('source', { length: 30 }).notNull().default('agency_manual'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({ tenantCodeUnique: uniqueIndex('candidates_tenant_code_unique').on(table.tenantId, table.candidateCode) }));

export const candidateDocuments = pgTable('candidate_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  candidateId: uuid('candidate_id').references(() => candidates.id, { onDelete: 'cascade' }).notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  storageKey: varchar('storage_key', { length: 500 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  fileSize: integer('file_size'),
  verificationStatus: varchar('verification_status', { length: 20 }).notNull().default('pending'),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const candidateBankDetails = pgTable('candidate_bank_details', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  candidateId: uuid('candidate_id').references(() => candidates.id, { onDelete: 'cascade' }).notNull().unique(),
  accountHolderName: varchar('account_holder_name', { length: 255 }),
  accountNumberEncrypted: text('account_number_encrypted'),
  accountNumberLast4: varchar('account_number_last4', { length: 4 }),
  ifscCode: varchar('ifsc_code', { length: 20 }),
  bankName: varchar('bank_name', { length: 150 }),
  panEncrypted: text('pan_encrypted'),
  panLast4: varchar('pan_last4', { length: 4 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
