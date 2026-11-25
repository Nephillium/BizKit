import assert from 'node:assert/strict';
import type { NextApiRequest, NextApiResponse } from 'next';
import { releaseAnonymousGeneration } from '../lib/anonymousQuota';
import { buildDemoOutput } from '../lib/demoContent';
import { demoSeedRefusal } from '../lib/demoSeedPolicy';
import { databaseSsl, pool } from '../lib/db';
import generateHandler from '../pages/api/generate';
import {
  creditDeltaAfterGeneration,
  generationGate,
  isDemoMode,
  providerConnectionError,
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
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    AI_BASE_URL: process.env.AI_BASE_URL,
    AI_API_KEY: process.env.AI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
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
    setEnv('AI_PROVIDER', undefined);
    setEnv('AI_MODEL', undefined);
    setEnv('AI_BASE_URL', undefined);
    setEnv('AI_API_KEY', undefined);
    setEnv('OPENAI_API_KEY', undefined);
    setEnv('NODE_ENV', 'development');
    assert.equal(isDemoMode(), true);
    assert.equal(resolveProvider().id, 'demo');
    assert.ok(publicDemoLogin());

    setEnv('HUGGINGFACE_API_KEY', 'hf_test');
    assert.equal(resolveProvider().id, 'huggingface');
    assert.equal(resolveProvider().detail, 'mistralai/Mistral-7B-Instruct-v0.3');
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
    assert.match(blocked.message, /AI_PROVIDER/);
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
    setEnv('SUPER_USER_EMAIL', 'demo@pitchcrafter.local');
    setEnv('DEMO_USER_EMAIL', 'demo@pitchcrafter.local');
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
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    AI_BASE_URL: process.env.AI_BASE_URL,
    AI_API_KEY: process.env.AI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  };
  try {
    setEnv('NODE_ENV', 'production');
    setEnv('DEMO_MODE', undefined);
    setEnv('HUGGINGFACE_API_KEY', undefined);
    setEnv('LMSTUDIO_API_URL', undefined);
    setEnv('AI_PROVIDER', undefined);
    setEnv('AI_MODEL', undefined);
    setEnv('AI_BASE_URL', undefined);
    setEnv('AI_API_KEY', undefined);
    setEnv('OPENAI_API_KEY', undefined);

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
    // The sample request records the anonymous quota for 127.0.0.1 when
    // DATABASE_URL is set. Clear it so a second local run is not refused.
    await releaseDevSampleClaim();
    const sample = await postGenerate({
      tool: 'proposal',
      inputs: { clientType: 'dental group', projectScope: 'new patient offers' },
    });
    assert.equal(sample.status, 200);
    assert.equal(sample.body.ok, true);
    assert.match(String(sample.body.output), /Demo mode — sample output/);
    assert.match(String(sample.body.output), /dental group/);
    await releaseDevSampleClaim();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      setEnv(key, value);
    }
  }
}

async function releaseDevSampleClaim(): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  await releaseAnonymousGeneration({
    socket: { remoteAddress: '127.0.0.1' },
    headers: {},
  } as NextApiRequest);
}

function testProviderConnectionError() {
  assert.match(providerConnectionError('lmstudio'), /LM Studio/);
  assert.match(providerConnectionError('huggingface'), /Hugging Face API is unreachable/);
  assert.doesNotMatch(providerConnectionError('huggingface'), /running/);
  assert.match(providerConnectionError('openai-compatible'), /OpenAI-compatible/);
  assert.match(providerConnectionError('openai'), /OpenAI API is unreachable/);
  assert.doesNotMatch(providerConnectionError('openai'), /compatible/);
  assert.doesNotMatch(providerConnectionError('huggingface'), /LM Studio/);
  assert.doesNotMatch(providerConnectionError('openai-compatible'), /LM Studio/);
}

function testDatabaseSsl() {
  assert.equal(databaseSsl('postgres://pitchcrafter:pitchcrafter@localhost:5432/pitchcrafter'), false);
  assert.equal(databaseSsl('postgres://pitchcrafter:pitchcrafter@127.0.0.1:5432/pitchcrafter'), false);
  const remote = databaseSsl('postgres://user:pw@db.example.com:5432/pitchcrafter?sslmode=require');
  assert.equal(typeof remote, 'object');
  assert.equal(databaseSsl('postgres://user:pw@db.example.com:5432/pitchcrafter?sslmode=disable'), false);
}

function testExplicitAiProvider() {
  const previous = {
    DEMO_MODE: process.env.DEMO_MODE,
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
    LMSTUDIO_API_URL: process.env.LMSTUDIO_API_URL,
    LMSTUDIO_MODEL: process.env.LMSTUDIO_MODEL,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    AI_BASE_URL: process.env.AI_BASE_URL,
    AI_API_KEY: process.env.AI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  };
  try {
    setEnv('NODE_ENV', 'production');
    setEnv('DEMO_MODE', undefined);
    setEnv('AI_PROVIDER', undefined);
    setEnv('AI_MODEL', undefined);
    setEnv('AI_BASE_URL', undefined);
    setEnv('AI_API_KEY', undefined);
    setEnv('OPENAI_API_KEY', undefined);
    setEnv('HUGGINGFACE_API_KEY', 'hf_test');
    setEnv('LMSTUDIO_API_URL', 'http://localhost:1234/v1');
    setEnv('LMSTUDIO_MODEL', 'demo-local');
    assert.equal(generationGate().provider, 'lmstudio');
    assert.equal(resolveProvider().detail, 'demo-local');

    setEnv('AI_PROVIDER', 'huggingface');
    setEnv('AI_MODEL', 'org/other-model');
    assert.equal(generationGate().provider, 'huggingface');
    assert.equal(resolveProvider().detail, 'org/other-model');

    setEnv('AI_MODEL', undefined);
    assert.equal(resolveProvider().id, 'huggingface');
    assert.equal(resolveProvider().detail, 'mistralai/Mistral-7B-Instruct-v0.3');

    setEnv('AI_PROVIDER', 'openai-compatible');
    setEnv('AI_MODEL', 'switchable-model');
    setEnv('AI_BASE_URL', 'https://example.test/v1');
    setEnv('AI_API_KEY', 'test-key');
    const switched = generationGate();
    assert.equal(switched.outcome, 'provider');
    assert.equal(switched.provider, 'openai-compatible');
    assert.equal(resolveProvider().detail, 'switchable-model');

    setEnv('AI_API_KEY', undefined);
    assert.equal(generationGate().outcome, 'unavailable');

    setEnv('AI_PROVIDER', 'not-a-brand');
    setEnv('AI_API_KEY', 'test-key');
    assert.equal(generationGate().outcome, 'unavailable');
    assert.equal(generationGate().chargesCredit, false);

    setEnv('AI_PROVIDER', undefined);
    setEnv('AI_API_KEY', undefined);
    setEnv('AI_BASE_URL', undefined);
    setEnv('AI_MODEL', undefined);
    setEnv('HUGGINGFACE_API_KEY', undefined);
    setEnv('LMSTUDIO_API_URL', undefined);
    setEnv('OPENAI_API_KEY', 'sk-test');
    const implied = generationGate();
    assert.equal(implied.outcome, 'provider');
    assert.equal(implied.provider, 'openai');
    assert.equal(resolveProvider().id, 'openai');
    assert.equal(resolveProvider().label, 'OpenAI');
    assert.equal(resolveProvider().detail, 'gpt-5-mini');

    setEnv('AI_MODEL', 'gpt-4.1-mini');
    assert.equal(resolveProvider().detail, 'gpt-4.1-mini');

    setEnv('AI_PROVIDER', 'openai');
    setEnv('AI_MODEL', undefined);
    setEnv('OPENAI_API_KEY', undefined);
    assert.equal(generationGate().outcome, 'unavailable');
    assert.equal(generationGate().chargesCredit, false);

    setEnv('OPENAI_API_KEY', 'sk-test');
    setEnv('HUGGINGFACE_API_KEY', 'hf_test');
    setEnv('AI_PROVIDER', 'huggingface');
    assert.equal(generationGate().provider, 'huggingface');
    assert.equal(resolveProvider().detail, 'mistralai/Mistral-7B-Instruct-v0.3');
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      setEnv(key, value);
    }
  }
}

testDemoCopy();
testProviderSelection();
testExplicitAiProvider();
testProviderConnectionError();
await testProductionGenerateReturns503WithoutCharging();
testDatabaseSsl();
await pool.end();
console.log('demo-mode tests passed');
