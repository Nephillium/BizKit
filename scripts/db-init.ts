import { loadLocalEnv } from './load-env';

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and start Postgres.');
  process.exit(1);
}

const { pool } = await import('../lib/db');
const { initSchema } = await import('../lib/initSchema');
const { provisionSuperUser } = await import('../lib/users');

try {
  await initSchema();
  const admin = await provisionSuperUser();
  console.log(`Database schema is ready. Admin provisioning: ${admin.status}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
