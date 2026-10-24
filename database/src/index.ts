import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import * as schema from './schema';

config({ path: '../../.env' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/manpower_platform';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export * from './schema';
