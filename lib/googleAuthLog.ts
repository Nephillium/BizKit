/**
 * One structured log line per Google auth request.
 * Fields are codes and booleans. Tokens, emails, names, cookies, and secrets
 * are not written. A thrown database error keeps its SQLSTATE and a scrubbed message.
 */

export type GoogleAuthLog = {
  route: string;
  status: number;
  error: string | null;
  has_id_token: boolean;
  token_length: number;
  kid: string | null;
  alg: string | null;
  verify: string | null;
  aud_matched: boolean | null;
  azp_present: boolean | null;
  azp_equals_client_id: boolean | null;
  error_name: string | null;
  pg_code: string | null;
  pg_message: string | null;
};

export function emptyGoogleAuthLog(route: string): GoogleAuthLog {
  return {
    route,
    status: 500,
    error: 'unhandled',
    has_id_token: false,
    token_length: 0,
    kid: null,
    alg: null,
    verify: null,
    aud_matched: null,
    azp_present: null,
    azp_equals_client_id: null,
    error_name: null,
    pg_code: null,
    pg_message: null,
  };
}

/** Map a verifier error onto the reason a tester can read in the logs. */
export function verifyReason(error: string | null | undefined): string | null {
  if (!error) return null;
  switch (error) {
    case 'bad_issuer':
      return 'iss';
    case 'bad_audience':
      return 'aud';
    case 'expired':
      return 'exp';
    case 'invalid_signature':
      return 'sig';
    case 'email_not_verified':
      return 'email_verified';
    default:
      return safeCode(error);
  }
}

export function noteGoogleAuthResult(log: GoogleAuthLog, status: number, error: string | null): void {
  log.status = status;
  log.error = error === null ? null : safeCode(error);
}

export function noteGoogleAuthThrow(log: GoogleAuthLog, status: number, error: string, thrown: unknown): void {
  noteGoogleAuthResult(log, status, error);
  const details = thrownAuthError(thrown);
  log.error_name = details.error_name;
  log.pg_code = details.pg_code;
  log.pg_message = details.pg_message;
}

export function scrubLogText(value: string): string {
  return value
    .replace(/eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g, '[token]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/postgres(?:ql)?:\/\/\S+/gi, '[database]')
    .replace(/\b(role|user)\s+"[^"]*"/gi, '$1 "[role]"')
    .replace(/\b(role|user)\s+[A-Za-z_][A-Za-z0-9_]*/gi, '$1 [role]')
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, '[redacted]')
    .slice(0, 240);
}

export function thrownAuthError(error: unknown): {
  error_name: string;
  pg_code: string | null;
  pg_message: string;
} {
  const name = error instanceof Error ? error.name : 'Error';
  const rawCode = error && typeof error === 'object' && 'code' in error
    ? (error as { code?: unknown }).code
    : null;
  const pg = typeof rawCode === 'string' && /^[0-9A-Z]{5}$/.test(rawCode) ? rawCode : null;
  const message = error instanceof Error ? error.message : 'unknown';
  return {
    error_name: safeCode(name) ?? 'Error',
    pg_code: pg,
    pg_message: scrubLogText(message),
  };
}

/** Hostname only. User, password, path, and query are dropped. */
export function databaseHost(databaseUrl: string | undefined): string | null {
  const raw = (databaseUrl || '').trim().replace(/^psql\s+/, '').replace(/^'|'$/g, '');
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname.trim().toLowerCase();
    if (!host || host.length > 253) return null;
    if (!/^[a-z0-9.-]+$/.test(host)) return null;
    return host;
  } catch {
    return null;
  }
}

export function describeIdToken(token: string, clientId: string): Pick<
  GoogleAuthLog,
  'has_id_token' | 'token_length' | 'kid' | 'alg' | 'aud_matched' | 'azp_present' | 'azp_equals_client_id'
> {
  const empty: Pick<
    GoogleAuthLog,
    'has_id_token' | 'token_length' | 'kid' | 'alg' | 'aud_matched' | 'azp_present' | 'azp_equals_client_id'
  > = {
    has_id_token: false,
    token_length: 0,
    kid: null,
    alg: null,
    aud_matched: null,
    azp_present: null,
    azp_equals_client_id: null,
  };
  if (typeof token !== 'string' || token.length === 0) return empty;
  const described = {
    ...empty,
    has_id_token: true,
    token_length: token.length,
  };
  const parts = token.split('.');
  if (parts.length < 2) return described;
  const header = decodeJsonSegment(parts[0] ?? '');
  const payload = decodeJsonSegment(parts[1] ?? '');
  if (header) {
    described.kid = safeLabel(header.kid);
    described.alg = safeLabel(header.alg);
  }
  if (payload) {
    described.aud_matched = audienceMatches(payload.aud, clientId);
    const azp = payload.azp;
    described.azp_present = typeof azp === 'string' && azp.length > 0;
    described.azp_equals_client_id = typeof azp === 'string' && clientId.length > 0 && azp === clientId;
  }
  return described;
}

let hostLogged = false;

export function resetGoogleAuthHostLogForTests(): void {
  hostLogged = false;
}

export function writeGoogleAuthLog(entry: GoogleAuthLog): void {
  if (!hostLogged) {
    hostLogged = true;
    console.info(JSON.stringify({
      event: 'google_auth_db',
      db_host: databaseHost(process.env.DATABASE_URL),
    }));
  }
  const line = JSON.stringify({
    event: 'google_auth',
    route: entry.route,
    status: entry.status,
    error: entry.error,
    has_id_token: entry.has_id_token,
    token_length: entry.token_length,
    kid: entry.kid,
    alg: entry.alg,
    verify: entry.verify,
    aud_matched: entry.aud_matched,
    azp_present: entry.azp_present,
    azp_equals_client_id: entry.azp_equals_client_id,
    error_name: entry.error_name,
    pg_code: entry.pg_code,
    pg_message: entry.pg_message,
  });
  if (entry.status >= 400) console.error(line);
  else console.info(line);
}

function safeCode(value: string): string | null {
  if (!/^[A-Za-z0-9_]{1,64}$/.test(value)) return null;
  return value;
}

function safeLabel(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(value)) return null;
  return value;
}

function audienceMatches(aud: unknown, clientId: string): boolean {
  if (!clientId) return false;
  if (typeof aud === 'string') return aud === clientId;
  return Array.isArray(aud) && aud.some((item) => item === clientId);
}

function decodeJsonSegment(segment: string): Record<string, unknown> | null {
  try {
    if (!segment || !/^[A-Za-z0-9_-]+$/.test(segment)) return null;
    const pad = segment.length % 4 === 0 ? '' : '='.repeat(4 - (segment.length % 4));
    const json = Buffer.from(segment.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8');
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}
