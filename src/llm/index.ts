/**
 * LLM factory and exports for ConnectOnion TypeScript SDK
 */

import { LLM } from '../types';
import { OpenAILLM } from './openai';

export { OpenAILLM } from './openai';

/**
 * Create an LLM instance based on the model name
 */
export function createLLM(model: string = 'gpt-4o-mini', apiKey?: string): LLM {
  // For now, we only support OpenAI models
  // In the future, we can add support for Anthropic, Google, etc.
  if (model.startsWith('gpt-') || model.startsWith('o1-')) {
    return new OpenAILLM(apiKey, model);
  }
  
  // Default to OpenAI
  return new OpenAILLM(apiKey, model);
}