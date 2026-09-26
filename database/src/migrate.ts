import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const runMigrations = async () => {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/manpower_platform';
  
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  console.log('Running migrations...');
  
  await migrate(db, { migrationsFolder: './migrations' });
  
  console.log('Migrations completed!');
  
  await migrationClient.end();
};

runMigrations().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});
