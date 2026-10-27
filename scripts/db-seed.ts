import { loadLocalEnv } from './load-env';

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and start Postgres.');
  process.exit(1);
}

const { pool } = await import('../lib/db');
const { seedDemoUser } = await import('../lib/users');
const { demoSeedConfig } = await import('../lib/demoSeedPolicy');

try {
  const result = await seedDemoUser();
  const { email } = demoSeedConfig();
  console.log(
    result.created
      ? `Created demo user ${email} with ${result.credits} credits.`
      : `Updated demo user ${email}. Credits are at least ${result.credits}.`
  );
  console.log('Password is DEMO_USER_PASSWORD, or demo-only-password when that variable is unset.');
  console.log('This account is role "user". It is not an admin.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
