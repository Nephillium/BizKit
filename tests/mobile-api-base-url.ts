import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// mobile/package.json is CommonJS, so a static ESM import cannot see its named exports.
const require = createRequire(import.meta.url);
const {
  LOCAL_API_BASE_URL,
  PRODUCTION_API_BASE_URL,
  resolveApiBaseUrl,
  resolveConfigApiBaseUrl,
} = require('../mobile/src/lib/apiBaseUrl.cjs') as typeof import('../mobile/src/lib/apiBaseUrl.cjs');
const { sellsCreditsInApp } = require('../mobile/src/lib/playBilling.ts') as typeof import('../mobile/src/lib/playBilling');

assert.equal(
  resolveApiBaseUrl({ envValue: 'http://localhost:5000/', dev: true }),
  LOCAL_API_BASE_URL,
);
assert.equal(resolveApiBaseUrl({ dev: true }), LOCAL_API_BASE_URL);
assert.equal(
  resolveApiBaseUrl({
    envValue: 'http://localhost:5000',
    extraValue: 'https://staging.glmlabs.io',
    dev: false,
  }),
  'https://staging.glmlabs.io',
);
assert.equal(
  resolveApiBaseUrl({
    envValue: 'http://localhost:5000',
    extraValue: 'http://127.0.0.1:5000',
    dev: false,
  }),
  PRODUCTION_API_BASE_URL,
);
assert.equal(
  resolveApiBaseUrl({
    envValue: 'https://staging.pitchcrafter.glmlabs.io/',
    dev: false,
  }),
  'https://staging.pitchcrafter.glmlabs.io',
);
assert.equal(
  resolveApiBaseUrl({
    extraValue: 'https://pitchcrafter.glmlabs.io/',
    dev: false,
  }),
  PRODUCTION_API_BASE_URL,
);
assert.equal(resolveConfigApiBaseUrl('http://127.0.0.1:5000', true), PRODUCTION_API_BASE_URL);
assert.equal(resolveConfigApiBaseUrl(undefined, false), LOCAL_API_BASE_URL);

assert.equal(sellsCreditsInApp('android'), false);
assert.equal(sellsCreditsInApp('ios'), true);
assert.equal(sellsCreditsInApp('web'), true);

console.log('mobile api base url tests passed');
