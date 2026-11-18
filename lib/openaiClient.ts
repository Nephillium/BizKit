export const DEFAULT_OPENAI_MODEL = 'gpt-5-mini';
export const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
export const OPENAI_REASONING_TOKEN_HEADROOM = 2048;
export const PROVIDER_ERROR_CODE = 'provider_error';
export const PROVIDER_ERROR_MESSAGE = 'The AI provider failed. Please try again.';

export class ProviderRequestError extends Error {
  readonly status = 502;
  readonly error = PROVIDER_ERROR_CODE;

  constructor(message = PROVIDER_ERROR_MESSAGE) {
    super(message);
    this.name = 'ProviderRequestError';
  }
}

export function openaiApiKey(): string {
  return (process.env.OPENAI_API_KEY || '').trim();
}

export function isOpenAiReasoningModel(model: string): boolean {
  const id = model.trim().toLowerCase();
  return (
    id.startsWith('gpt-5') ||
    id.startsWith('o1') ||
    id.startsWith('o3') ||
    id.startsWith('o4')
  );
}

export function buildOpenAiChatBody(options: {
  model: string;
  prompt: string;
  maxTokens: number;
  temperature: number;
  useCompletionTokens?: boolean;
}): Record<string, unknown> {
  const useCompletionTokens =
    options.useCompletionTokens ?? isOpenAiReasoningModel(options.model);
  const body: Record<string, unknown> = {
    model: options.model,
    messages: [{ role: 'user', content: options.prompt }],
  };
  if (useCompletionTokens) {
    const headroom = isOpenAiReasoningModel(options.model)
      ? OPENAI_REASONING_TOKEN_HEADROOM
      : 0;
    body.max_completion_tokens = options.maxTokens + headroom;
  } else {
    body.max_tokens = options.maxTokens;
    body.temperature = options.temperature;
  }
  return body;
}

function looksLikeUnsupportedParameter(errorText: string): boolean {
  const text = errorText.toLowerCase();
  return (
    text.includes('unsupported parameter') ||
    text.includes('unsupported value') ||
    text.includes('max_completion_tokens') ||
    text.includes("temperature' does not support")
  );
}

async function requestChatCompletion(
  fetchImpl: typeof fetch,
  apiKey: string,
  body: Record<string, unknown>
): Promise<{
  ok: boolean;
  status: number;
  content: string;
  errorText: string;
}> {
  const response = await fetchImpl(OPENAI_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const raw = await response.text();
  if (!response.ok) {
    console.error('OpenAI API error:', response.status);
    return { ok: false, status: response.status, content: '', errorText: raw };
  }

  let result: {
    choices?: Array<{ message?: { content?: string } }>;
  };
  try {
    result = JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }> };
  } catch {
    throw new ProviderRequestError();
  }

  return {
    ok: true,
    status: response.status,
    content: result.choices?.[0]?.message?.content || '',
    errorText: '',
  };
}

export async function callOpenAI(
  prompt: string,
  maxTokens: number,
  temperature: number,
  model: string,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const apiKey = openaiApiKey();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const preferCompletionTokens = isOpenAiReasoningModel(model);
  let result = await requestChatCompletion(
    fetchImpl,
    apiKey,
    buildOpenAiChatBody({
      model,
      prompt,
      maxTokens,
      temperature,
      useCompletionTokens: preferCompletionTokens,
    })
  );

  if (
    !result.ok &&
    result.status === 400 &&
    !preferCompletionTokens &&
    looksLikeUnsupportedParameter(result.errorText)
  ) {
    result = await requestChatCompletion(
      fetchImpl,
      apiKey,
      buildOpenAiChatBody({
        model,
        prompt,
        maxTokens,
        temperature,
        useCompletionTokens: true,
      })
    );
  }

  if (!result.ok || !result.content.trim()) {
    throw new ProviderRequestError();
  }

  return result.content;
}
