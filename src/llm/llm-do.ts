/**
 * llmDo - simple one-shot completion helper (Python parity with llm_do)
 *
 * Example:
 *   const text = await llmDo('Hello', { model: 'gpt-4o-mini' })
 */
import { createLLM } from './index';
import type { Message } from '../types';

export interface LlmDoOptions {
  model?: string;
  apiKey?: string;
  system?: string;
  temperature?: number;
}

export async function llmDo(prompt: string, opts: LlmDoOptions = {}): Promise<string> {
  const { model, apiKey, system } = opts;
  const llm = createLLM(model, apiKey);

  const messages: Message[] = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const res = await llm.complete(messages);
  return res.content ?? '';
}

