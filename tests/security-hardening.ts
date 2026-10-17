import assert from 'node:assert/strict';
import type { NextApiRequest } from 'next';
import {
  anonymousSubject,
  enforceAnonymousClaim,
  quotaDecision,
  resolveClientAddress,
} from '../lib/anonymousQuota';
import { publicSignupBlockReason, roleAfterAuthentication } from '../lib/superUserPolicy';

function request(remoteAddress: string, forwardedFor?: string): NextApiRequest {
  return {
    socket: { remoteAddress },
    headers: forwardedFor ? { 'x-forwarded-for': forwardedFor } : {},
  } as NextApiRequest;
}

function testClientAddress() {
  assert.equal(
    resolveClientAddress({
      remoteAddress: '10.0.0.8',
      forwardedFor: '203.0.113.5, 198.51.100.9',
      trustProxy: false,
    }),
    '10.0.0.8'
  );

  assert.equal(
    resolveClientAddress({
      remoteAddress: '10.0.0.8',
      forwardedFor: '203.0.113.5, 198.51.100.9',
      trustProxy: true,
    }),
    '198.51.100.9'
  );

  assert.equal(
    resolveClientAddress({
      remoteAddress: '::ffff:192.0.2.10',
      forwardedFor: null,
      trustProxy: false,
    }),
    '192.0.2.10'
  );

  assert.equal(
    resolveClientAddress({
      remoteAddress: '10.0.0.8',
      forwardedFor: ['203.0.113.4', '192.0.2.20'],
      trustProxy: true,
    }),
    '192.0.2.20'
  );
}

function testQuotaDecision() {
  const now = Date.UTC(2026, 9, 17);
  const day = 24 * 60 * 60 * 1000;
  assert.equal(quotaDecision(null, now), 'claim');
  assert.equal(quotaDecision(now - day, now), 'used');
  assert.equal(quotaDecision(now - 365 * day, now), 'claim');
}

function testAdminElevation() {
  const previous = process.env.SUPER_USER_EMAIL;
  process.env.SUPER_USER_EMAIL = 'Owner@Example.com';
  try {
    assert.equal(publicSignupBlockReason('owner@example.com'), 'This email cannot be registered');
    assert.equal(publicSignupBlockReason('  OWNER@example.com '), 'This email cannot be registered');
    assert.equal(publicSignupBlockReason('someoneelse@example.com'), null);
    assert.equal(roleAfterAuthentication('user', 'owner@example.com'), 'user');
    assert.equal(roleAfterAuthentication('admin', 'owner@example.com'), 'admin');
    assert.equal(roleAfterAuthentication('user', 'someoneelse@example.com'), 'user');
  } finally {
    if (previous === undefined) delete process.env.SUPER_USER_EMAIL;
    else process.env.SUPER_USER_EMAIL = previous;
  }

  delete process.env.SUPER_USER_EMAIL;
  assert.equal(publicSignupBlockReason('owner@example.com'), null);
}

async function down(): Promise<'claimed' | 'used'> {
  throw new Error('database unavailable');
}

function setEnv(name: string, value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[name];
  else env[name] = value;
}

async function testServerSideQuotaIgnoresForwardedHeader() {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousTrust = process.env.TRUST_PROXY;
  setEnv('TRUST_PROXY', undefined);

  try {
    assert.equal(
      anonymousSubject(request('198.51.100.10', '1.1.1.1')),
      anonymousSubject(request('198.51.100.10', '8.8.8.8'))
    );
    assert.notEqual(
      anonymousSubject(request('198.51.100.10', '1.1.1.1')),
      anonymousSubject(request('198.51.100.11', '1.1.1.1'))
    );

    setEnv('NODE_ENV', 'production');
    assert.equal(await enforceAnonymousClaim('prod-subject', down), 'unavailable');
    assert.equal(await enforceAnonymousClaim('prod-subject', down), 'unavailable');

    setEnv('NODE_ENV', 'development');
    assert.equal(await enforceAnonymousClaim('dev-subject', down), 'claimed');
    assert.equal(await enforceAnonymousClaim('dev-subject', down), 'used');
    assert.equal(await enforceAnonymousClaim('dev-subject-b', down), 'claimed');
  } finally {
    setEnv('NODE_ENV', previousNodeEnv);
    setEnv('TRUST_PROXY', previousTrust);
  }
}

testClientAddress();
testQuotaDecision();
testAdminElevation();
await testServerSideQuotaIgnoresForwardedHeader();
console.log('security-hardening tests passed');
