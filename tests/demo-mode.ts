import assert from 'node:assert/strict';
import { buildDemoOutput } from '../lib/demoContent';
import { demoSeedRefusal } from '../lib/demoSeedPolicy';
import { databaseSsl } from '../lib/db';
import { isDemoMode, publicDemoLogin, resolveProvider } from '../lib/runtimeConfig';

function setEnv(name: string, value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[name];
  else env[name] = value;
}

function testDemoCopy() {
  const tools = ['cold_email', 'proposal', 'contract', 'social_pack'] as const;
  const samples = [
    { target: 'clinic owners', service: 'recall reminders' },
    { clientType: 'dental group', projectScope: 'new patient offers' },
    { clientName: 'North Clinic', providerName: 'Harbor Studio' },
    { businessType: 'bakery', niche: 'sourdough', platform: 'Instagram' },
  ];
  tools.forEach((tool, index) => {
    const output = buildDemoOutput(tool, samples[index], { length: 'standard', creativity: 40 });
    assert.match(output, /Demo mode — sample output/);
    const needle = Object.values(samples[index])[0];
    assert.ok(output.includes(needle), `${tool} should include ${needle}`);
  });
  const detailed = buildDemoOutput('social_pack', { businessType: 'bakery' }, { length: 'detailed' });
  const short = buildDemoOutput('social_pack', { businessType: 'bakery' }, { length: 'short' });
  assert.ok(detailed.length > short.length);
}

function testProviderSelection() {
  const previous = {
    DEMO_MODE: process.env.DEMO_MODE,
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
    LMSTUDIO_API_URL: process.env.LMSTUDIO_API_URL,
    LMSTUDIO_MODEL: process.env.LMSTUDIO_MODEL,
    NODE_ENV: process.env.NODE_ENV,
    DEMO_USER_EMAIL: process.env.DEMO_USER_EMAIL,
    DEMO_USER_PASSWORD: process.env.DEMO_USER_PASSWORD,
    DEMO_USER_CREDITS: process.env.DEMO_USER_CREDITS,
    SUPER_USER_EMAIL: process.env.SUPER_USER_EMAIL,
  };
  try {
    setEnv('DEMO_MODE', undefined);
    setEnv('HUGGINGFACE_API_KEY', undefined);
    setEnv('LMSTUDIO_API_URL', undefined);
    setEnv('NODE_ENV', 'development');
    assert.equal(isDemoMode(), true);
    assert.equal(resolveProvider().id, 'demo');
    assert.ok(publicDemoLogin());

    setEnv('HUGGINGFACE_API_KEY', 'hf_test');
    assert.equal(resolveProvider().id, 'huggingface');
    setEnv('LMSTUDIO_API_URL', 'http://localhost:1234/v1');
    setEnv('LMSTUDIO_MODEL', 'demo-local');
    assert.equal(resolveProvider().id, 'lmstudio');
    assert.equal(resolveProvider().detail, 'demo-local');

    setEnv('DEMO_MODE', '1');
    assert.equal(resolveProvider().id, 'demo');

    setEnv('NODE_ENV', 'production');
    assert.equal(publicDemoLogin(), null);
    assert.equal(demoSeedRefusal(), 'Demo seed refuses to run when NODE_ENV=production');

    setEnv('NODE_ENV', 'development');
    setEnv('SUPER_USER_EMAIL', 'demo@bizkit.local');
    setEnv('DEMO_USER_EMAIL', 'demo@bizkit.local');
    assert.match(demoSeedRefusal() || '', /SUPER_USER_EMAIL/);
    assert.equal(publicDemoLogin(), null);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      setEnv(key, value);
    }
  }
}

function testDatabaseSsl() {
  assert.equal(databaseSsl('postgres://bizkit:bizkit@localhost:5432/bizkit'), false);
  assert.equal(databaseSsl('postgres://bizkit:bizkit@127.0.0.1:5432/bizkit'), false);
  const remote = databaseSsl('postgres://user:pw@db.example.com:5432/bizkit?sslmode=require');
  assert.equal(typeof remote, 'object');
  assert.equal(databaseSsl('postgres://user:pw@db.example.com:5432/bizkit?sslmode=disable'), false);
}

testDemoCopy();
testProviderSelection();
testDatabaseSsl();
console.log('demo-mode tests passed');
