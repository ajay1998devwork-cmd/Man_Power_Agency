import { pgTable, uuid, varchar, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

const tenantStatus = pgEnum('tenant_status', ['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE']);
const accountStatus = pgEnum('tenant_account_status', ['ACTIVE', 'SUSPENDED', 'INACTIVE']);

export const agencyTenants = pgTable('tenants', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  contactPersonName: varchar('contact_person_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  status: tenantStatus('status').notNull(),
});

export const tenantAccounts = pgTable('tenant_accounts', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  username: varchar('username', { length: 100 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  status: accountStatus('status').notNull(),
  mustChangePassword: boolean('must_change_password').notNull(),
  lastLoginAt: timestamp('last_login_at'),
});
