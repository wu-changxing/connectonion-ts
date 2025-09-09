/**
 * ConnectOnion TypeScript SDK
 * A framework for creating AI agents with behavior tracking
 */

export { Agent } from './core/agent';
export { createLLM, OpenAILLM } from './llm';
export { History } from './history';
export { 
  createToolFromFunction, 
  isClassInstance, 
  extractMethodsFromInstance,
  processTools 
} from './tools/tool-utils';

export * from './types';