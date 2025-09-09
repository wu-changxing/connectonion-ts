/**
 * Core Agent implementation for ConnectOnion TypeScript SDK
 * 
 * The Agent class is the main orchestrator that combines LLM capabilities
 * with tool execution to create powerful AI agents that can perform actions.
 */

import { 
  AgentConfig, 
  Tool, 
  LLM, 
  Message, 
  ToolResult
} from '../types';
import { createLLM } from '../llm';
import { History } from '../history';
import { processTools } from '../tools/tool-utils';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Agent class - The core of ConnectOnion
 * 
 * An Agent combines:
 * - LLM for intelligence and reasoning
 * - Tools for taking actions
 * - History for behavior tracking
 * - System prompts for personality
 * 
 * @example
 * ```typescript
 * // Create a simple agent with a calculator tool
 * function add(a: number, b: number): number {
 *   return a + b;
 * }
 * 
 * const agent = new Agent({
 *   name: 'calculator',
 *   tools: [add],
 *   systemPrompt: 'You are a helpful math assistant.'
 * });
 * 
 * const response = await agent.input('What is 5 plus 3?');
 * console.log(response); // "5 plus 3 equals 8"
 * ```
 */
export class Agent {
  /** Unique identifier for this agent */
  private name: string;
  
  /** System prompt that defines the agent's behavior and personality */
  private systemPrompt: string;
  
  /** Maximum number of iterations for tool calling loops */
  private maxIterations: number;
  
  /** Array of tools available to this agent */
  private tools: Tool[];
  
  /** Quick lookup map for tools by name */
  private toolMap: Map<string, Tool>;
  
  /** LLM instance for generating responses */
  private llm: LLM;
  
  /** History tracker for recording all agent behaviors */
  private history: History;

  /**
   * Creates a new Agent instance
   * 
   * @param config - Configuration object for the agent
   * @param config.name - Unique name for the agent (used for behavior tracking)
   * @param config.llm - Optional custom LLM instance
   * @param config.tools - Array of tools (functions, class instances, or Tool objects)
   * @param config.systemPrompt - System prompt defining agent behavior
   * @param config.apiKey - API key for LLM provider (uses env var if not provided)
   * @param config.model - Model to use (default: 'gpt-4o-mini')
   * @param config.maxIterations - Max iterations for tool calling (default: 10)
   * 
   * @example
   * ```typescript
   * // With environment variable for API key
   * const agent = new Agent({
   *   name: 'my-agent',
   *   tools: [myTool1, myTool2]
   * });
   * 
   * // With explicit API key
   * const agent = new Agent({
   *   name: 'my-agent',
   *   apiKey: 'sk-...',
   *   model: 'gpt-4',
   *   tools: [myTool]
   * });
   * ```
   */
  constructor(config: AgentConfig) {
    this.name = config.name;
    this.systemPrompt = config.systemPrompt || `You are ${config.name}, a helpful AI assistant.`;
    this.maxIterations = config.maxIterations || 10;
    
    // Process tools: convert functions, class instances, etc. to Tool objects
    this.tools = processTools(config.tools || []);
    
    // Create a map for O(1) tool lookup by name
    this.toolMap = new Map(this.tools.map(tool => [tool.name, tool]));
    
    // Initialize behavior history tracking
    // All behaviors are saved to ~/.connectonion/agents/{name}/behavior.json
    this.history = new History(this.name);
    
    // Initialize LLM - either use provided instance or create one
    if (config.llm) {
      this.llm = config.llm;
    } else {
      // Create LLM based on model name (currently supports OpenAI)
      this.llm = createLLM(config.model || 'gpt-4o-mini', config.apiKey);
    }
    
    // Trust parameter handling can be added later if needed
  }

  /**
   * Process user input and generate a response
   * 
   * This is the main entry point for interacting with the agent.
   * The agent will:
   * 1. Process the input prompt
   * 2. Decide whether to use tools
   * 3. Execute any necessary tool calls
   * 4. Generate a final response
   * 
   * @param prompt - The user's input prompt
   * @param maxIterations - Override the default max iterations for this request
   * @returns The agent's response as a string
   * 
   * @example
   * ```typescript
   * const response = await agent.input('What is the weather in NYC?');
   * console.log(response);
   * 
   * // With custom iteration limit for complex tasks
   * const response = await agent.input(
   *   'Analyze this data and create a report',
   *   20 // Allow more iterations for complex task
   * );
   * ```
   */
  async input(prompt: string, maxIterations?: number): Promise<string> {
    const iterations = maxIterations || this.maxIterations;
    
    // Record the input in history
    this.history.addInput(prompt);
    
    // Initialize conversation with system prompt and user input
    const messages: Message[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt }
    ];
    
    // Convert tools to OpenAI-compatible function schemas
    const toolSchemas = this.tools.map(tool => tool.toFunctionSchema());
    
    let finalResponse = '';
    
    // Main execution loop - allows for multiple rounds of tool calling
    for (let i = 0; i < iterations; i++) {
      // Call LLM with current conversation and available tools
      const llmResponse = await this.llm.complete(messages, toolSchemas);
      
      // Record the LLM response in history
      this.history.addLLMResponse(llmResponse);
      
      // Add assistant's response to the conversation
      if (llmResponse.content || llmResponse.toolCalls.length > 0) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: llmResponse.content || '',
        };
        
        // Include tool calls in the message if present
        if (llmResponse.toolCalls.length > 0) {
          assistantMessage.tool_calls = llmResponse.toolCalls;
        }
        
        messages.push(assistantMessage);
      }
      
      // Process tool calls if the LLM requested any
      if (llmResponse.toolCalls.length > 0) {
        // Execute all tool calls in parallel for efficiency
        const toolResults = await this.executeToolCalls(llmResponse.toolCalls);
        
        // Add tool results back to the conversation
        // This allows the LLM to see the results and continue reasoning
        for (const result of toolResults) {
          messages.push({
            role: 'tool',
            content: JSON.stringify(result.result),
            tool_call_id: result.callId,
          });
        }
      } else {
        // No more tool calls - we have our final response
        finalResponse = llmResponse.content || '';
        break;
      }
    }
    
    // Record the final output in history
    this.history.addOutput(finalResponse);
    
    return finalResponse;
  }

  /**
   * Execute multiple tool calls in parallel
   * 
   * @param toolCalls - Array of tool calls to execute
   * @returns Array of results with their corresponding call IDs
   * 
   * @private
   */
  private async executeToolCalls(
    toolCalls: Array<{ name: string; arguments: any; id: string }>
  ): Promise<Array<{ result: ToolResult; callId: string }>> {
    // Execute all tool calls in parallel using Promise.all
    // This significantly improves performance when multiple tools are called
    const results = await Promise.all(
      toolCalls.map(async (toolCall) => {
        const result = await this.executeToolCall(
          toolCall.name,
          toolCall.arguments,
          toolCall.id
        );
        return { result, callId: toolCall.id };
      })
    );
    
    return results;
  }

  /**
   * Execute a single tool call
   * 
   * @param name - Name of the tool to execute
   * @param args - Arguments to pass to the tool
   * @param callId - Unique identifier for this tool call
   * @returns The result of the tool execution
   * 
   * @private
   */
  private async executeToolCall(
    name: string,
    args: any,
    callId: string
  ): Promise<ToolResult> {
    // Look up the tool by name
    const tool = this.toolMap.get(name);
    
    // Handle case where tool doesn't exist
    if (!tool) {
      const result: ToolResult = {
        status: 'not_found',
        error: `Tool ${name} not found`,
      };
      
      // Record the failed tool call in history
      this.history.addToolCall(name, args, result, callId);
      return result;
    }
    
    try {
      // Execute the tool with provided arguments
      const output = await tool.run(args);
      const result: ToolResult = {
        status: 'success',
        result: output,
      };
      
      // Record successful tool call in history
      this.history.addToolCall(name, args, result, callId);
      return result;
    } catch (error) {
      // Handle tool execution errors gracefully
      const result: ToolResult = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
      
      // Record the error in history
      this.history.addToolCall(name, args, result, callId);
      return result;
    }
  }

  /**
   * Get the complete conversation history
   * 
   * @returns Array of all behavior entries
   * 
   * @example
   * ```typescript
   * const history = agent.getHistory();
   * console.log(`Total interactions: ${history.length}`);
   * 
   * // Filter for tool calls
   * const toolCalls = history.filter(h => h.type === 'tool_call');
   * ```
   */
  getHistory() {
    return this.history.getBehaviors();
  }

  /**
   * Clear the conversation history
   * 
   * This removes all recorded behaviors for this agent.
   * Use with caution as this action cannot be undone.
   * 
   * @example
   * ```typescript
   * agent.clearHistory();
   * console.log('History cleared');
   * ```
   */
  clearHistory() {
    this.history.clear();
  }

  /**
   * Get all available tools for this agent
   * 
   * @returns Array of Tool objects
   * 
   * @example
   * ```typescript
   * const tools = agent.getTools();
   * console.log('Available tools:');
   * tools.forEach(tool => {
   *   console.log(`- ${tool.name}: ${tool.description}`);
   * });
   * ```
   */
  getTools(): Tool[] {
    return this.tools;
  }

  /**
   * Dynamically add a new tool to the agent
   * 
   * @param tool - Tool to add (function, class instance, or Tool object)
   * 
   * @example
   * ```typescript
   * // Add a function as a tool
   * function newTool(param: string): string {
   *   return `Processed: ${param}`;
   * }
   * agent.addTool(newTool);
   * 
   * // Add a class instance
   * class MyService {
   *   getData(): string { return 'data'; }
   * }
   * agent.addTool(new MyService());
   * ```
   */
  addTool(tool: Tool | Function | any): void {
    const processed = processTools([tool]);
    for (const t of processed) {
      this.tools.push(t);
      this.toolMap.set(t.name, t);
    }
  }

  /**
   * Remove a tool by name
   * 
   * @param name - Name of the tool to remove
   * @returns true if the tool was found and removed, false otherwise
   * 
   * @example
   * ```typescript
   * const removed = agent.removeTool('oldTool');
   * if (removed) {
   *   console.log('Tool removed successfully');
   * }
   * ```
   */
  removeTool(name: string): boolean {
    const index = this.tools.findIndex(t => t.name === name);
    if (index !== -1) {
      this.tools.splice(index, 1);
      this.toolMap.delete(name);
      return true;
    }
    return false;
  }
}