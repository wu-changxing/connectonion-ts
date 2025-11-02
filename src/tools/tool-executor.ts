/**
 * Tool execution utilities for ConnectOnion TypeScript SDK
 *
 * Migrated from Python tool_executor.py
 * Provides standalone tool execution with detailed trace entry creation
 */

import { Tool } from '../types';
import { Console } from '../console';

/**
 * Trace entry structure for tool execution
 */
export interface TraceEntry {
  type: 'tool_execution';
  tool_name: string;
  arguments: Record<string, any>;
  call_id: string;
  timing: number;
  status: 'pending' | 'success' | 'error' | 'not_found';
  result: string | null;
  iteration: number;
  timestamp: number;
  error?: string;
  error_type?: string;
}

/**
 * Execute a single tool and return trace entry
 *
 * Migrated directly from Python tool_executor.py:66-195
 *
 * @param toolName - Name of the tool to execute
 * @param toolArgs - Arguments to pass to the tool
 * @param toolId - ID of the tool call
 * @param toolMap - Map of tool names to Tool objects
 * @param agent - Agent instance with current session
 * @param console - Console for output
 * @returns Trace entry with execution details
 */
export async function executeSingleTool(
  toolName: string,
  toolArgs: Record<string, any>,
  toolId: string,
  toolMap: Map<string, Tool>,
  agent: any,
  console: Console
): Promise<TraceEntry> {
  // Console output
  const argsStr = JSON.stringify(toolArgs);
  const argsPreview = argsStr.length > 50 ? argsStr.slice(0, 50) + '...' : argsStr;
  console.print(`→ Tool: ${toolName}(${argsPreview})`);

  // Create single trace entry
  const traceEntry: TraceEntry = {
    type: 'tool_execution',
    tool_name: toolName,
    arguments: toolArgs,
    call_id: toolId,
    timing: 0,
    status: 'pending',
    result: null,
    iteration: agent.currentIteration || 0,
    timestamp: Date.now()
  };

  // Check if tool exists
  const tool = toolMap.get(toolName);
  if (!tool) {
    const errorMsg = `Tool '${toolName}' not found`;
    traceEntry.result = errorMsg;
    traceEntry.status = 'not_found';
    traceEntry.error = errorMsg;
    console.print(`✗ ${errorMsg}`);
    return traceEntry;
  }

  // Execute the tool with timing
  const toolStart = Date.now();
  try {
    const result = await tool.run(toolArgs);
    const toolDuration = Date.now() - toolStart;

    traceEntry.timing = toolDuration;
    traceEntry.result = String(result);
    traceEntry.status = 'success';

    // Console output
    const resultStr = String(result);
    const resultPreview = resultStr.length > 50 ? resultStr.slice(0, 50) + '...' : resultStr;
    const timeStr = toolDuration < 100 ? `${(toolDuration / 1000).toFixed(4)}s` : `${(toolDuration / 1000).toFixed(1)}s`;
    console.print(`← Result (${timeStr}): ${resultPreview}`);

  } catch (e) {
    const toolDuration = Date.now() - toolStart;

    traceEntry.timing = toolDuration;
    traceEntry.status = 'error';
    traceEntry.error = e instanceof Error ? e.message : String(e);
    traceEntry.error_type = e instanceof Error ? e.constructor.name : typeof e;
    traceEntry.result = `Error executing tool: ${traceEntry.error}`;

    const timeStr = toolDuration < 100 ? `${(toolDuration / 1000).toFixed(4)}s` : `${(toolDuration / 1000).toFixed(1)}s`;
    console.print(`✗ Error (${timeStr}): ${traceEntry.error}`);
  }

  return traceEntry;
}

/**
 * Execute multiple tools and record results
 *
 * Migrated from Python tool_executor.py:24-64
 *
 * @param toolCalls - List of tool calls from LLM response
 * @param toolMap - Map of tool names to Tool objects
 * @param agent - Agent instance
 * @param console - Console for output
 */
export async function executeAndRecordTools(
  toolCalls: Array<{ name: string; arguments: any; id: string }>,
  toolMap: Map<string, Tool>,
  agent: any,
  console: Console
): Promise<void> {
  // Execute each tool
  for (const toolCall of toolCalls) {
    const traceEntry = await executeSingleTool(
      toolCall.name,
      toolCall.arguments,
      toolCall.id,
      toolMap,
      agent,
      console
    );

    // Add trace entry to agent session
    if (agent.trace) {
      agent.trace.push(traceEntry);
    }
  }
}
