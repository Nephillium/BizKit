import assert from 'node:assert/strict';
import {
  DEFAULT_OPENAI_MODEL,
  OPENAI_REASONING_TOKEN_HEADROOM,
  PROVIDER_ERROR_CODE,
  PROVIDER_ERROR_MESSAGE,
  ProviderRequestError,
  buildOpenAiChatBody,
  callOpenAI,
  isOpenAiReasoningModel,
} from '../lib/openaiClient';

function setEnv(name: string, value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[name];
  else env[name] = value;
}

function testModelParamShapes() {
  assert.equal(isOpenAiReasoningModel('gpt-5-mini'), true);
  assert.equal(isOpenAiReasoningModel('gpt-5'), true);
  assert.equal(isOpenAiReasoningModel('gpt-4.1-mini'), false);
  assert.equal(DEFAULT_OPENAI_MODEL, 'gpt-5-mini');

  const reasoning = buildOpenAiChatBody({
    model: 'gpt-5-mini',
    prompt: 'Hello',
    maxTokens: 500,
    temperature: 0.4,
  });
  assert.equal(reasoning.max_tokens, undefined);
  assert.equal(reasoning.temperature, undefined);
  assert.equal(reasoning.max_completion_tokens, 500 + OPENAI_REASONING_TOKEN_HEADROOM);
  assert.deepEqual(reasoning.messages, [{ role: 'user', content: 'Hello' }]);

  const classic = buildOpenAiChatBody({
    model: 'gpt-4.1-mini',
    prompt: 'Hello',
    maxTokens: 500,
    temperature: 0.4,
  });
  assert.equal(classic.max_completion_tokens, undefined);
  assert.equal(classic.max_tokens, 500);
  assert.equal(classic.temperature, 0.4);
}

async function testCallOpenAIMapsProviderFailures() {
  const previous = process.env.OPENAI_API_KEY;
  setEnv('OPENAI_API_KEY', 'sk-test-not-a-real-key');
  try {
    await assert.rejects(
      () =>
        callOpenAI('Hello', 40, 0.5, 'gpt-4.1-mini', async () =>
          new Response(JSON.stringify({ error: { message: 'quota exceeded for sk-test-not-a-real-key' } }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          })
        ),
      (error: unknown) => {
        assert.ok(error instanceof ProviderRequestError);
        assert.equal(error.status, 502);
        assert.equal(error.error, PROVIDER_ERROR_CODE);
        assert.equal(error.message, PROVIDER_ERROR_MESSAGE);
        assert.doesNotMatch(error.message, /quota|sk-test|exceeded/i);
        return true;
      }
    );

    const retryCalls: unknown[] = [];
    const content = await callOpenAI(
      'Hello',
      40,
      0.5,
      'gpt-4.1-mini',
      async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        retryCalls.push(body);
        if (body.max_tokens !== undefined) {
          return new Response(
            JSON.stringify({
              error: {
                message: "Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.",
              },
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ choices: [{ message: { content: 'PitchCrafter test OK' } }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    );
    assert.equal(content, 'PitchCrafter test OK');
    assert.equal(retryCalls.length, 2);
    assert.equal((retryCalls[1] as { max_completion_tokens?: number }).max_completion_tokens, 40);
    assert.equal((retryCalls[1] as { temperature?: number }).temperature, undefined);

    await assert.rejects(
      () =>
        callOpenAI('Hello', 40, 0.5, 'gpt-5-mini', async () =>
          new Response(
            JSON.stringify({ choices: [{ message: { content: '' }, finish_reason: 'length' }] }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        ),
      (error: unknown) => error instanceof ProviderRequestError
    );
  } finally {
    setEnv('OPENAI_API_KEY', previous);
  }
}

testModelParamShapes();
await testCallOpenAIMapsProviderFailures();
console.log('openai-provider tests passed');
