import type { Generation } from '../shared/schema';
import { query, queryOne, execute } from './db';
import { GENERATIONS_DDL } from './initSchema';
import { isGenerationTool } from './demoContent';

const MAX_OUTPUT_CHARS = 50000;
const MAX_INPUTS_CHARS = 20000;

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

export async function listGenerations(userId: string): Promise<Generation[]> {
  await ensureTable();
  const rows = await query<GenerationRow>(
    `SELECT id, user_id, tool_type, inputs, output, created_at
     FROM generations
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );
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
  const removed = await execute(
    'DELETE FROM generations WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return removed > 0;
}
