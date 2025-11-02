/**
 * Xray debugging context for ConnectOnion TypeScript SDK
 *
 * Migrated from Python xray.py (simplified version)
 * Provides context injection for @xray decorated tools
 */

/**
 * Xray context interface - made available globally during tool execution
 */
export interface XrayContext {
  agent: any | null;
  task: string | null;
  userPrompt: string | null;
  messages: any[];
  iteration: number | null;
  previousTools: string[];
}

/**
 * Global xray context storage
 */
let xrayContext: XrayContext = {
  agent: null,
  task: null,
  userPrompt: null,
  messages: [],
  iteration: null,
  previousTools: []
};

/**
 * Inject debugging context before tool execution
 *
 * Migrated from Python xray.py:430-445
 *
 * @param agent - The Agent instance
 * @param userPrompt - Original user prompt string from agent.input()
 * @param messages - Conversation history
 * @param iteration - Current iteration number
 * @param previousTools - List of previously called tool names
 */
export function injectXrayContext(
  agent: any,
  userPrompt: string,
  messages: any[],
  iteration: number,
  previousTools: string[]
): void {
  xrayContext.agent = agent;
  xrayContext.task = userPrompt;
  xrayContext.userPrompt = userPrompt;
  xrayContext.messages = messages;
  xrayContext.iteration = iteration;
  xrayContext.previousTools = previousTools;
}

/**
 * Clear debugging context after tool execution
 *
 * Migrated from Python xray.py:448-454
 */
export function clearXrayContext(): void {
  xrayContext.agent = null;
  xrayContext.task = null;
  xrayContext.userPrompt = null;
  xrayContext.messages = [];
  xrayContext.iteration = null;
  xrayContext.previousTools = [];
}

/**
 * Check if a function has the @xray decorator
 *
 * Migrated from Python xray.py:457-467
 *
 * @param func - Function to check
 * @returns True if function is decorated with @xray
 */
export function isXrayEnabled(func: any): boolean {
  return (func as any).__xray__ === true;
}

/**
 * Get current xray context (for tools to access)
 */
export function getXrayContext(): XrayContext {
  return xrayContext;
}
