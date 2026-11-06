import assert from 'node:assert/strict';
import type { NextApiRequest, NextApiResponse } from 'next';

export type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => unknown | Promise<unknown>;

export type ApiResult = {
  status: number;
  body: any;
  headers: Record<string, string | string[]>;
};

export type InvokeOptions = {
  method: string;
  body?: unknown;
  query?: Record<string, string | string[]>;
  headers?: Record<string, string | string[] | undefined>;
  remoteAddress?: string;
};

/**
 * Call a Pages Router API handler in-process.
 * The suite uses this instead of booting Next so CI stays a single Node process
 * against the Postgres service.
 */
export function invoke(handler: ApiHandler, options: InvokeOptions): Promise<ApiResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const headers: Record<string, string | string[]> = {};
    let statusCode = 200;
    const timer = setTimeout(() => {
      finish(new Error(`API handler timed out (${options.method})`));
    }, 10000);

    function finish(error: Error | null, result?: ApiResult) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(result as ApiResult);
    }

    const req = {
      method: options.method,
      body: options.body,
      query: options.query ?? {},
      headers: { ...(options.headers ?? {}) },
      socket: { remoteAddress: options.remoteAddress ?? '203.0.113.10' },
    } as unknown as NextApiRequest;

    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(payload: unknown) {
        finish(null, { status: statusCode, body: payload, headers });
        return this;
      },
      setHeader(name: string, value: string | number | string[]) {
        const key = name.toLowerCase();
        const next = Array.isArray(value) ? value.map(String) : [String(value)];
        const existing = headers[key];
        headers[key] = existing === undefined ? next.length === 1 ? next[0] : next : [
          ...(Array.isArray(existing) ? existing : [existing]),
          ...next,
        ];
        return this;
      },
      getHeader(name: string) {
        return headers[name.toLowerCase()];
      },
    } as unknown as NextApiResponse;

    Promise.resolve()
      .then(() => handler(req, res))
      .then(() => {
        if (!settled) finish(new Error(`API handler returned without a JSON body (${options.method})`));
      })
      .catch((error: unknown) => {
        finish(error instanceof Error ? error : new Error(String(error)));
      });
  });
}

/** First `name=value` pair from a Set-Cookie header. */
export function cookieHeaderFromSetCookie(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') {
    assert.fail('expected a Set-Cookie header');
  }
  const pair = raw.split(';')[0]?.trim();
  assert.ok(pair && pair.includes('='), `unusable Set-Cookie: ${raw}`);
  return pair;
}
