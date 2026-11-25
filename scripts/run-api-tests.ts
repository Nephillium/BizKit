import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { loadLocalEnv } from './load-env';

loadLocalEnv();

function blank(name: string): boolean {
  const value = process.env[name];
  return value === undefined || value.trim() === '';
}

if (blank('DATABASE_URL')) {
  process.env.DATABASE_URL = 'postgres://pitchcrafter:pitchcrafter@127.0.0.1:5432/pitchcrafter';
  console.log('DATABASE_URL is unset. Using postgres://pitchcrafter@127.0.0.1:5432/pitchcrafter (local docker-compose).');
}

const configuredSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET || '';
if (configuredSecret.trim().length < 32) {
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  console.log('Generated a throwaway JWT_SECRET for this test process.');
}

if (blank('QUOTA_IP_SALT')) {
  process.env.QUOTA_IP_SALT = randomBytes(32).toString('hex');
  console.log('Generated a throwaway QUOTA_IP_SALT for this test process.');
}

function runTestFile(file: string): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['--import', 'tsx', '--test', '--test-concurrency=1', file],
      { stdio: 'inherit', env: process.env }
    );
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      resolve(code);
    });
  });
}

for (const file of ['tests/api/api.test.ts', 'tests/api/retention.test.ts']) {
  const code = await runTestFile(file);
  if (code) process.exit(code);
}
