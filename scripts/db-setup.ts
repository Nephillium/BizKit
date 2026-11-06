import { loadLocalEnv } from './load-env';

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and start Postgres.');
  process.exit(1);
}

const { pool } = await import('../lib/db');
const { initSchema } = await import('../lib/initSchema');
const { findUserByEmail, provisionSuperUser, seedDemoUser } = await import('../lib/users');
const { seedDemoHistory } = await import('../lib/generations');

try {
  await initSchema();
  const admin = await provisionSuperUser();
  console.log(`Database schema is ready. Admin provisioning: ${admin.status}.`);
  const seeded = await seedDemoUser();
  console.log(
    seeded.created
      ? `Created demo user ${seeded.email} with ${seeded.credits} credits.`
      : `Updated demo user ${seeded.email}. Credits are at least ${seeded.credits}.`
  );
  const seededUser = await findUserByEmail(seeded.email);
  if (seededUser) {
    const added = await seedDemoHistory(seededUser.id);
    if (added > 0) {
      console.log(`Added ${added} sample generations for History.`);
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
