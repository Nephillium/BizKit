import type { Generation } from '../shared/schema';
import { query, queryOne, execute } from './db';
import { GENERATIONS_DDL } from './initSchema';
import { buildDemoOutput, isGenerationTool, type GenerationTool } from './demoContent';

const MAX_OUTPUT_CHARS = 50000;
const MAX_INPUTS_CHARS = 20000;
const MAX_HISTORY_QUERY = 200;
const HISTORY_LIMIT = 50;

export interface GenerationListFilter {
  tool: GenerationTool | null;
  query: string | null;
}

const EMPTY_FILTER: GenerationListFilter = { tool: null, query: null };

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function parseGenerationListFilter(input: {
  tool?: unknown;
  query?: unknown;
}): { ok: true; filter: GenerationListFilter } | { ok: false; error: 'invalid_tool' | 'query_too_long' } {
  let tool: GenerationTool | null = null;
  if (typeof input.tool === 'string' && input.tool.trim() !== '' && input.tool !== 'all') {
    if (!isGenerationTool(input.tool)) return { ok: false, error: 'invalid_tool' };
    tool = input.tool;
  }

  let queryText: string | null = null;
  if (typeof input.query === 'string') {
    const trimmed = input.query.trim();
    if (trimmed.length > MAX_HISTORY_QUERY) return { ok: false, error: 'query_too_long' };
    if (trimmed.length > 0) queryText = trimmed;
  }

  return { ok: true, filter: { tool, query: queryText } };
}

/**
 * History reads are always scoped to the signed-in user. Search text is a bound
 * parameter, never concatenated into the statement.
 */
export function buildGenerationListQuery(
  userId: string,
  filter: GenerationListFilter = EMPTY_FILTER
): { text: string; values: unknown[] } {
  const values: unknown[] = [userId];
  const clauses = ['user_id = $1'];

  if (filter.tool) {
    values.push(filter.tool);
    clauses.push(`tool_type = $${values.length}`);
  }

  if (filter.query) {
    values.push(`%${escapeLike(filter.query)}%`);
    const placeholder = `$${values.length}`;
    clauses.push(
      `(output ILIKE ${placeholder} ESCAPE '\\' OR inputs::text ILIKE ${placeholder} ESCAPE '\\')`
    );
  }

  return {
    text: `SELECT id, user_id, tool_type, inputs, output, created_at
     FROM generations
     WHERE ${clauses.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT ${HISTORY_LIMIT}`,
    values,
  };
}

export function ownedGenerationDelete(
  userId: string,
  id: number
): { text: string; values: [number, string] } {
  return {
    text: 'DELETE FROM generations WHERE id = $1 AND user_id = $2',
    values: [id, userId],
  };
}

interface GenerationRow {
  id: number;
  user_id: string;
  tool_type: string;
  inputs: Record<string, unknown> | null;
  output: string;
  created_at: Date;
}

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await query(GENERATIONS_DDL);
      await query(
        'CREATE INDEX IF NOT EXISTS idx_generations_user_created ON generations (user_id, created_at DESC)'
      );
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  return tableReady;
}

function mapRow(row: GenerationRow): Generation {
  return {
    id: row.id,
    userId: row.user_id,
    toolType: row.tool_type,
    inputs: row.inputs ?? {},
    output: row.output,
    createdAt: row.created_at,
  };
}

export async function listGenerations(
  userId: string,
  filter: GenerationListFilter = EMPTY_FILTER
): Promise<Generation[]> {
  await ensureTable();
  const statement = buildGenerationListQuery(userId, filter);
  const rows = await query<GenerationRow>(statement.text, statement.values);
  return rows.map(mapRow);
}

export async function createGeneration(
  userId: string,
  toolType: string,
  inputs: unknown,
  output: unknown
): Promise<{ generation?: Generation; error?: string }> {
  if (!isGenerationTool(toolType)) {
    return { error: 'invalid_tool' };
  }
  if (typeof output !== 'string' || output.trim().length === 0) {
    return { error: 'invalid_output' };
  }
  if (inputs !== null && typeof inputs !== 'object') {
    return { error: 'invalid_inputs' };
  }
  const safeInputs = inputs && typeof inputs === 'object' ? inputs : {};
  const serialized = JSON.stringify(safeInputs);
  if (serialized.length > MAX_INPUTS_CHARS) {
    return { error: 'invalid_inputs' };
  }
  const safeOutput = output.slice(0, MAX_OUTPUT_CHARS);
  await ensureTable();
  const row = await queryOne<GenerationRow>(
    `INSERT INTO generations (user_id, tool_type, inputs, output)
     VALUES ($1, $2, $3::jsonb, $4)
     RETURNING id, user_id, tool_type, inputs, output, created_at`,
    [userId, toolType, serialized, safeOutput]
  );
  if (!row) return { error: 'save_failed' };
  return { generation: mapRow(row) };
}

export async function deleteGeneration(userId: string, id: number): Promise<boolean> {
  await ensureTable();
  const statement = ownedGenerationDelete(userId, id);
  const removed = await execute(statement.text, statement.values);
  return removed > 0;
}

const DEMO_HISTORY_SAMPLES: Array<{
  tool: GenerationTool;
  daysAgo: number;
  inputs: Record<string, string>;
}> = [
  {
    tool: 'cold_email',
    daysAgo: 1,
    inputs: {
      target: 'clinic owners',
      service: 'recall reminders',
      tone: 'warm',
      language: 'English',
    },
  },
  {
    tool: 'proposal',
    daysAgo: 4,
    inputs: {
      clientType: 'a Maple Dental group',
      projectScope: 'a four-week patient-recall site',
      deliverables: 'homepage, three emails, and a booking page',
      budgetRange: '$6,000-$9,000',
      language: 'English',
    },
  },
  {
    tool: 'contract',
    daysAgo: 9,
    inputs: {
      clientName: 'Northwind Studio',
      providerName: 'Harbor Studio',
      serviceDescription: 'monthly outreach drafts for Northwind Studio',
      paymentTerms: '50% on signature and 50% on delivery',
      jurisdiction: 'Delaware, USA',
      language: 'English',
    },
  },
  {
    tool: 'social_pack',
    daysAgo: 15,
    inputs: {
      businessType: 'a sourdough bakery',
      niche: 'weekend bread subscriptions',
      tone: 'friendly',
      platform: 'Instagram',
      language: 'English',
    },
  },
];

/** Sample history for the local demo user. Skips accounts that already have rows. */
export async function seedDemoHistory(userId: string): Promise<number> {
  await ensureTable();
  const existing = await queryOne<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM generations WHERE user_id = $1',
    [userId]
  );
  if (!existing || Number(existing.count) > 0) return 0;

  for (const sample of DEMO_HISTORY_SAMPLES) {
    const output = buildDemoOutput(sample.tool, sample.inputs, {
      length: 'standard',
      creativity: 40,
    });
    await query(
      `INSERT INTO generations (user_id, tool_type, inputs, output, created_at)
       VALUES ($1, $2, $3::jsonb, $4, NOW() - ($5::int * INTERVAL '1 day'))`,
      [userId, sample.tool, JSON.stringify(sample.inputs), output, sample.daysAgo]
    );
  }
  return DEMO_HISTORY_SAMPLES.length;
}
