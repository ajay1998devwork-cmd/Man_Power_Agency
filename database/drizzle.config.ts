import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { fileURLToPath } from 'node:url';

// drizzle-kit runs with `database/` as its working directory when invoked
// through the workspace filter, so explicitly load the shared root env file.
config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/manpower_platform',
  },
});
