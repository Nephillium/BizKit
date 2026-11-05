import assert from 'node:assert/strict';
import type { NextApiRequest, NextApiResponse } from 'next';
import { buildDemoOutput } from '../lib/demoContent';
import { demoSeedRefusal } from '../lib/demoSeedPolicy';
import { databaseSsl } from '../lib/db';
import generateHandler from '../pages/api/generate';
import {
  creditDeltaAfterGeneration,
  generationGate,
  isDemoMode,
  publicDemoLogin,
  publicRuntimeConfig,
  resolveProvider,
} from '../lib/runtimeConfig';

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
    assert.equal(resolveProvider().id, 'demo');
    assert.equal(generationGate().chargesCredit, true);

    setEnv('DEMO_MODE', undefined);
    setEnv('HUGGINGFACE_API_KEY', undefined);
    setEnv('LMSTUDIO_API_URL', undefined);
    assert.equal(isDemoMode(), false);
    const blocked = generationGate();
    assert.equal(blocked.outcome, 'unavailable');
    assert.equal(blocked.chargesCredit, false);
    if (blocked.outcome !== 'unavailable') {
      throw new Error('expected the production gate to be unavailable');
    }
    assert.equal(blocked.status, 503);
    assert.equal(blocked.error, 'ai_not_configured');
    assert.match(blocked.message, /No credit was deducted/);
    assert.equal(resolveProvider().id, 'unconfigured');
    assert.equal(publicRuntimeConfig().demoMode, false);
    assert.equal(publicRuntimeConfig().provider, 'unconfigured');
    assert.equal(
      creditDeltaAfterGeneration({ gate: blocked, isLoggedIn: true, isAdmin: false }),
      0
    );
    assert.equal(
      creditDeltaAfterGeneration({ gate: blocked, isLoggedIn: true, isAdmin: true }),
      0
    );

    for (const flag of ['', '0', 'false', 'no']) {
      setEnv('DEMO_MODE', flag);
      assert.equal(generationGate().outcome, 'unavailable', `DEMO_MODE=${flag || '(empty)'} should not enable samples`);
      assert.equal(generationGate().chargesCredit, false);
    }

    for (const flag of ['1', 'true', 'yes']) {
      setEnv('DEMO_MODE', flag);
      const preview = generationGate();
      assert.equal(preview.outcome, 'sample', `DEMO_MODE=${flag} should keep sample output`);
      assert.equal(isDemoMode(), true);
      assert.equal(resolveProvider().id, 'demo');
      assert.equal(
        creditDeltaAfterGeneration({ gate: preview, isLoggedIn: true, isAdmin: false }),
        -1
      );
    }

    setEnv('DEMO_MODE', undefined);
    setEnv('HUGGINGFACE_API_KEY', 'hf_test');
    assert.equal(generationGate().outcome, 'provider');
    assert.equal(generationGate().provider, 'huggingface');
    assert.equal(generationGate().chargesCredit, true);
    setEnv('HUGGINGFACE_API_KEY', undefined);
    setEnv('LMSTUDIO_API_URL', 'http://localhost:1234/v1');
    assert.equal(generationGate().provider, 'lmstudio');

    setEnv('NODE_ENV', 'development');
    setEnv('DEMO_MODE', undefined);
    setEnv('HUGGINGFACE_API_KEY', undefined);
    setEnv('LMSTUDIO_API_URL', undefined);
    const devSamples = generationGate();
    assert.equal(devSamples.outcome, 'sample');
    assert.equal(isDemoMode(), true);
    assert.equal(resolveProvider().id, 'demo');
    assert.equal(
      creditDeltaAfterGeneration({ gate: devSamples, isLoggedIn: true, isAdmin: false }),
      -1
    );
    assert.equal(
      creditDeltaAfterGeneration({ gate: devSamples, isLoggedIn: false, isAdmin: false }),
      0
    );

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

function postGenerate(
  body: unknown,
  headers: Record<string, string | string[] | undefined> = {}
): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('generate handler timed out; it may have touched the database or a provider'));
    }, 2000);
    let statusCode = 200;
    const req = {
      method: 'POST',
      headers,
      body,
      socket: { remoteAddress: '127.0.0.1' },
    } as NextApiRequest;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(payload: Record<string, unknown>) {
        clearTimeout(timer);
        resolve({ status: statusCode, body: payload });
        return this;
      },
      setHeader() {
        return this;
      },
    } as unknown as NextApiResponse;
    Promise.resolve(generateHandler(req, res)).catch((error: unknown) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function testProductionGenerateReturns503WithoutCharging() {
  const previous = {
    DEMO_MODE: process.env.DEMO_MODE,
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
    LMSTUDIO_API_URL: process.env.LMSTUDIO_API_URL,
    NODE_ENV: process.env.NODE_ENV,
  };
  try {
    setEnv('NODE_ENV', 'production');
    setEnv('DEMO_MODE', undefined);
    setEnv('HUGGINGFACE_API_KEY', undefined);
    setEnv('LMSTUDIO_API_URL', undefined);

    const blocked = await postGenerate(
      {
        tool: 'cold_email',
        inputs: {
          target: 'clinic owners',
          service: 'recall reminders',
          tone: 'warm',
          language: 'English',
        },
      },
      {
        cookie: 'bizkit_token=not-a-real-session',
        authorization: 'Bearer not-a-real-session',
      }
    );
    assert.equal(blocked.status, 503);
    assert.equal(blocked.body.ok, false);
    assert.equal(blocked.body.error, 'ai_not_configured');
    assert.equal(blocked.body.output, undefined);
    assert.match(String(blocked.body.message), /No credit was deducted/);
    assert.equal(generationGate().chargesCredit, false);
    assert.equal(
      creditDeltaAfterGeneration({
        gate: generationGate(),
        isLoggedIn: true,
        isAdmin: false,
      }),
      0
    );

    setEnv('DEMO_MODE', '1');
    assert.equal(generationGate().outcome, 'sample');
    assert.equal(generationGate().chargesCredit, true);

    setEnv('NODE_ENV', 'development');
    setEnv('DEMO_MODE', undefined);
    assert.equal(generationGate().outcome, 'sample');
    const sample = await postGenerate({
      tool: 'proposal',
      inputs: { clientType: 'dental group', projectScope: 'new patient offers' },
    });
    assert.equal(sample.status, 200);
    assert.equal(sample.body.ok, true);
    assert.match(String(sample.body.output), /Demo mode — sample output/);
    assert.match(String(sample.body.output), /dental group/);
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
await testProductionGenerateReturns503WithoutCharging();
testDatabaseSsl();
console.log('demo-mode tests passed');
