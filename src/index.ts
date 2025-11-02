/**
 * ConnectOnion TypeScript SDK
 * A framework for creating AI agents with behavior tracking
 */

export { Agent } from './core/agent';
export { createLLM, OpenAILLM, AnthropicLLM, GeminiLLM } from './llm';
export { History } from './history';
export { 
  createToolFromFunction, 
  isClassInstance, 
  extractMethodsFromInstance,
  processTools,
  xray,
} from './tools/tool-utils';
export * from './trust';

export * from './types';
export { llmDo } from './llm/llm-do';
