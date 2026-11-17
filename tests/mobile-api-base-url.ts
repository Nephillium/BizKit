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

for (const localUrl of [
  'http://10.0.2.2:5000',
  'http://10.1.2.3:5000/',
  'http://192.168.1.20:5000',
  'http://172.16.0.5:5000',
  'http://172.31.255.255:5000',
]) {
  assert.equal(
    resolveApiBaseUrl({ envValue: localUrl, dev: false }),
    PRODUCTION_API_BASE_URL,
    localUrl,
  );
}

assert.equal(
  resolveApiBaseUrl({
    envValue: 'http://192.168.0.8:5000',
    extraValue: 'http://10.0.2.2:5000',
    dev: false,
  }),
  PRODUCTION_API_BASE_URL,
);
assert.equal(
  resolveApiBaseUrl({ envValue: 'http://192.168.0.8:5000/', dev: true }),
  'http://192.168.0.8:5000',
);
assert.equal(
  resolveApiBaseUrl({ envValue: 'http://172.15.0.1:5000', dev: false }),
  'http://172.15.0.1:5000',
);
assert.equal(
  resolveApiBaseUrl({ envValue: 'http://172.32.0.1:5000', dev: false }),
  'http://172.32.0.1:5000',
);
assert.equal(
  resolveApiBaseUrl({ envValue: 'http://11.0.0.1:5000', dev: false }),
  'http://11.0.0.1:5000',
);

assert.equal(sellsCreditsInApp('android'), false);
assert.equal(sellsCreditsInApp('ios'), true);
assert.equal(sellsCreditsInApp('web'), true);

console.log('mobile api base url tests passed');
