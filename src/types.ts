/**
 * Core type definitions for ConnectOnion TypeScript SDK
 * 
 * This file contains all the TypeScript interfaces and types used throughout
 * the SDK. These types provide compile-time safety and excellent IDE support.
 */

/**
 * Represents a tool call request from the LLM
 * @interface ToolCall
 */
export interface ToolCall {
  /** The name of the tool to call */
  name: string;
  /** Arguments to pass to the tool function */
  arguments: Record<string, any>;
  /** Unique identifier for this tool call */
  id: string;
}

/**
 * Response from an LLM completion request
 * @interface LLMResponse
 */
export interface LLMResponse {
  /** Text content from the LLM (null if only tool calls) */
  content: string | null;
  /** Array of tool calls the LLM wants to make */
  toolCalls: ToolCall[];
  /** Raw response from the underlying API */
  rawResponse: any;
}

/**
 * Represents a message in the conversation history
 * @interface Message
 */
export interface Message {
  /** The role of the message sender */
  role: 'system' | 'user' | 'assistant' | 'tool';
  /** The message content */
  content: string;
  /** Optional name for the message sender */
  name?: string;
  /** Tool calls made by the assistant */
  tool_calls?: ToolCall[];
  /** ID linking this message to a specific tool call */
  tool_call_id?: string;
}

/**
 * OpenAI-compatible function schema for tool definitions
 * @interface FunctionSchema
 */
export interface FunctionSchema {
  /** The function name */
  name: string;
  /** Description of what the function does */
  description: string;
  /** JSON Schema for the function parameters */
  parameters: {
    /** Always 'object' for function parameters */
    type: 'object';
    /** Properties schema for each parameter */
    properties: Record<string, any>;
    /** List of required parameter names */
    required?: string[];
  };
}

/**
 * Represents a tool that can be used by an agent
 * @interface Tool
 */
export interface Tool {
  /** Unique name for the tool */
  name: string;
  /** Description of what the tool does (shown to LLM) */
  description: string;
  /** Function to execute the tool with given arguments */
  run: (args: Record<string, any>) => Promise<any> | any;
  /** Converts the tool to an OpenAI function schema */
  toFunctionSchema: () => FunctionSchema;
  /** Optional: mark as @xray to pause in debugger */
  xray?: boolean;
}

/**
 * Result from executing a tool
 * @interface ToolResult
 */
export interface ToolResult {
  /** Status of the tool execution */
  status: 'success' | 'error' | 'not_found';
  /** The result value if successful */
  result?: any;
  /** Error message if failed */
  error?: string;
}

/**
 * Entry in the agent's behavior history
 * @interface BehaviorEntry
 */
export interface BehaviorEntry {
  /** ISO timestamp when this behavior occurred */
  timestamp: string;
  /** Type of behavior being recorded */
  type: 'input' | 'llm_response' | 'tool_call' | 'output';
  /** The actual data for this behavior */
  data: any;
}

/**
 * Configuration options for creating an Agent
 * @interface AgentConfig
 */
export interface AgentConfig {
  /** Unique name for the agent (used for behavior tracking) */
  name: string;
  /** Custom LLM instance (optional, defaults to OpenAI) */
  llm?: LLM;
  /** Array of tools available to the agent */
  tools?: Tool[] | Function[] | any[];
  /** System prompt defining agent behavior */
  systemPrompt?: string;
  /** API key for the LLM provider */
  apiKey?: string;
  /** Model to use (e.g., 'gpt-4o-mini') */
  model?: string;
  /** Maximum iterations for tool calling (default: 10) */
  maxIterations?: number;
  /** Trust configuration for the agent */
  trust?: string | any; // Agent type would create circular dependency
  /** Logging: true=./{name}.log, false=off, undefined=~/.co/logs/{name}.log, or string path */
  log?: boolean | string;
}

/**
 * Interface for Language Model providers
 * @interface LLM
 */
export interface LLM {
  /**
   * Complete a conversation with optional tool support
   * @param messages - Conversation history
   * @param tools - Available tools as function schemas
   * @returns Promise resolving to the LLM response
   */
  complete(messages: Message[], tools?: FunctionSchema[]): Promise<LLMResponse>;

  /**
   * Generate structured output matching a schema.
   * Provider implementations may use native structured APIs if available,
   * otherwise they will prompt the model to return strict JSON and parse it.
   * @param messages - Conversation history
   * @param schema - JSON Schema-like object describing expected output
   */
  structuredComplete<T = any>(messages: Message[], schema: any): Promise<T>;
}
