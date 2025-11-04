/**
 * Real provider smoke tests (run only if keys are present).
 * Uses llmDo for minimal end-to-end checks with Anthropic, OpenAI, Gemini, and co/.
 */

import { llmDo } from '../../src';

jest.setTimeout(60000);

describe('Real Providers (keys required)', () => {
  it('Anthropic: claude-3-5-sonnet-20241022', async () => {
    if (!process.env.ANTHROPIC_API_KEY) return;
    const res = await llmDo("Reply with 'ok' only.", { model: 'claude-3-5-sonnet-20241022' });
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
  });

  it('OpenAI: gpt-4o-mini', async () => {
    if (!process.env.OPENAI_API_KEY) return;
    const res = await llmDo('What is 2+2? Return only the number.', { model: 'gpt-4o-mini' });
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
  });

  it('Gemini: gemini-1.5-flash', async () => {
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) return;
    const res = await llmDo("Say 'ok'.", { model: 'gemini-1.5-flash' });
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
  });

  it('OpenOnion co/: co/o4-mini', async () => {
    if (!process.env.OPENONION_API_KEY) return;
    const res = await llmDo('ok', { model: 'co/o4-mini' });
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
  });
});

