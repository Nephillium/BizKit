import type { NextApiRequest, NextApiResponse } from 'next';
import { requestHasCronSecret } from '../../../lib/cronAuth';
import { runRetentionCleanup } from '../../../lib/retention';

export const config = {
  maxDuration: 60,
};

function queryFlag(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' && /^(1|true|yes)$/i.test(raw);
}

function dryRunRequested(req: NextApiRequest): boolean {
  const forced = process.env.RETENTION_DRY_RUN ?? '';
  if (/^(1|true|yes)$/i.test(forced.trim())) return true;
  if (queryFlag(req.query.dryRun) || queryFlag(req.query.dry_run)) return true;
  if (req.body && typeof req.body === 'object') {
    const body = req.body as { dryRun?: unknown; dry_run?: unknown };
    if (body.dryRun === true || body.dry_run === true) return true;
  }
  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  if (!requestHasCronSecret(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(404).json({ ok: false, error: 'not_found' });
  }

  try {
    const report = await runRetentionCleanup({ dryRun: dryRunRequested(req) });
    return res.status(200).json({ ok: true, ...report });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : '';
    console.error(`Retention cleanup failed${code ? ` (${code})` : ''}`);
    return res.status(500).json({ ok: false, error: 'retention_failed' });
  }
}
