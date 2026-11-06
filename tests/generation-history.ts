import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  buildGenerationListQuery,
  escapeLike,
  ownedGenerationDelete,
  parseGenerationListFilter,
} from '../lib/generations';
import listHandler from '../pages/api/generations/index';
import deleteHandler from '../pages/api/generations/[id]';

function setEnv(name: string, value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[name];
  else env[name] = value;
}

function testQueryOwnershipAndBinding() {
  const sneaky = "%' OR user_id <> 'victim' --";
  const parsed = parseGenerationListFilter({ tool: 'social_pack', query: sneaky });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;

  const statement = buildGenerationListQuery('owner-1', parsed.filter);
  assert.equal(statement.values[0], 'owner-1');
  assert.match(statement.text, /user_id = \$1/);
  assert.match(statement.text, /tool_type = \$2/);
  assert.equal(statement.values[1], 'social_pack');
  assert.equal(statement.text.includes(sneaky), false);
  assert.equal(statement.text.includes('victim'), false);
  assert.equal(statement.values[2], `%${escapeLike(sneaky)}%`);
  assert.match(String(statement.values[2]), /\\%/);
  assert.match(statement.text, /ESCAPE '\\'/);

  const all = buildGenerationListQuery('owner-2', { tool: null, query: null });
  assert.deepEqual(all.values, ['owner-2']);
  assert.equal(all.text.includes('tool_type ='), false);
  assert.match(all.text, /LIMIT 50/);

  assert.equal(escapeLike('100%_done\\x'), '100\\%\\_done\\\\x');

  const blank = parseGenerationListFilter({ tool: 'all', query: '   ' });
  assert.equal(blank.ok, true);
  if (blank.ok) assert.deepEqual(blank.filter, { tool: null, query: null });

  assert.deepEqual(parseGenerationListFilter({ tool: 'invoice' }), { ok: false, error: 'invalid_tool' });
  assert.deepEqual(parseGenerationListFilter({ query: 'x'.repeat(201) }), {
    ok: false,
    error: 'query_too_long',
  });
}

function testDeleteStaysOnOwner() {
  const statement = ownedGenerationDelete('owner-9', 42);
  assert.equal(statement.text, 'DELETE FROM generations WHERE id = $1 AND user_id = $2');
  assert.deepEqual(statement.values, [42, 'owner-9']);
  assert.equal(statement.text.includes('owner-9'), false);
}

function invoke(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  init: { method: string; query?: NextApiRequest['query']; headers?: NextApiRequest['headers'] }
): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${init.method} handler timed out; it may have touched the database`));
    }, 1500);
    let statusCode = 200;
    const req = {
      method: init.method,
      query: init.query ?? {},
      headers: init.headers ?? {},
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
    } as unknown as NextApiResponse;
    Promise.resolve(handler(req, res)).catch((error: unknown) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function testRoutesRejectAnonymousAndBadFilters() {
  const previous = {
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  };
  const secret = 'history-test-secret-with-32-chars';
  setEnv('JWT_SECRET', secret);
  setEnv('NODE_ENV', 'test');
  try {
    const anonymous = await invoke(listHandler, { method: 'GET', query: { q: 'clinic' } });
    assert.equal(anonymous.status, 401);
    assert.equal(anonymous.body.error, 'not_authenticated');

    const token = jwt.sign(
      { id: 'user-a', email: 'a@example.com', role: 'user' },
      secret,
      { expiresIn: '1h' }
    );
    const headers = { authorization: `Bearer ${token}` };

    const badTool = await invoke(listHandler, {
      method: 'GET',
      query: { tool: 'not-a-tool', userId: 'someone-else' },
      headers,
    });
    assert.equal(badTool.status, 400);
    assert.equal(badTool.body.error, 'invalid_tool');

    const longQuery = await invoke(listHandler, {
      method: 'GET',
      query: { q: 'z'.repeat(201) },
      headers,
    });
    assert.equal(longQuery.status, 400);
    assert.equal(longQuery.body.error, 'query_too_long');

    const missing = await invoke(deleteHandler, { method: 'DELETE', query: { id: '4' } });
    assert.equal(missing.status, 401);

    const badId = await invoke(deleteHandler, {
      method: 'DELETE',
      query: { id: 'nope' },
      headers,
    });
    assert.equal(badId.status, 400);
    assert.equal(badId.body.error, 'invalid_id');

    const cookieOnly = await invoke(deleteHandler, {
      method: 'DELETE',
      query: { id: '0' },
      headers: { cookie: `bizkit_token=${token}` },
    });
    assert.equal(cookieOnly.status, 400);
    assert.equal(cookieOnly.body.error, 'invalid_id');

    const wrongMethod = await invoke(deleteHandler, {
      method: 'GET',
      query: { id: '4' },
      headers,
    });
    assert.equal(wrongMethod.status, 405);
  } finally {
    setEnv('JWT_SECRET', previous.JWT_SECRET);
    setEnv('NODE_ENV', previous.NODE_ENV);
  }
}

testQueryOwnershipAndBinding();
testDeleteStaysOnOwner();
await testRoutesRejectAnonymousAndBadFilters();
console.log('generation history checks passed');
