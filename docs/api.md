# API Reference

Complete reference for the ConnectOnion TypeScript SDK. This document covers all classes, interfaces, methods, and configuration options.

---

## Table of Contents

1. [Agent Class](#agent-class)
2. [Interfaces](#interfaces)
3. [Types](#types)
4. [LLM Providers](#llm-providers)
5. [Error Handling](#error-handling)
6. [Configuration](#configuration)

---

## Agent Class

The `Agent` class is the core of ConnectOnion. It orchestrates communication between the LLM and your tools.

### Constructor

```typescript
new Agent(config: AgentConfig)
```

Creates a new agent instance with the specified configuration.

**Parameters:**
- `config: AgentConfig` - Configuration object for the agent

**Example:**
```typescript
const agent = new Agent({
  name: 'my-agent',
  tools: [myTool],
  systemPrompt: 'You are a helpful assistant.',
  model: 'gpt-4o-mini'
});
```

### Methods

#### `input(message: string): Promise<string>`

Sends a message to the agent and returns the response.

**Parameters:**
- `message: string` - The user's message/question

**Returns:**
- `Promise<string>` - The agent's response

**Example:**
```typescript
const response = await agent.input('What is 2 + 2?');
console.log(response); // "2 + 2 equals 4."
```

#### `addTool(tool: Tool | Function | object): void`

Adds a new tool to the agent after creation.

**Parameters:**
- `tool: Tool | Function | object` - Tool to add (function, class instance, or Tool interface)

**Example:**
```typescript
function newTool(param: string): string {
  return `Processed: ${param}`;
}

agent.addTool(newTool);
```

#### `removeTool(toolName: string): boolean`

Removes a tool from the agent by name.

**Parameters:**
- `toolName: string` - Name of the tool to remove

**Returns:**
- `boolean` - `true` if tool was removed, `false` if not found

**Example:**
```typescript
const removed = agent.removeTool('oldTool');
console.log(removed); // true if successful
```

#### `getTools(): Tool[]`

Gets all current tools attached to the agent.

**Returns:**
- `Tool[]` - Array of all tools

**Example:**
```typescript
const tools = agent.getTools();
console.log(tools.map(t => t.name)); // ['add', 'multiply', 'getWeather']
```

#### `getHistory(): BehaviorEntry[]`

Gets the complete conversation and behavior history.

**Returns:**
- `BehaviorEntry[]` - Array of all behavior entries with timestamps

**Example:**
```typescript
const history = agent.getHistory();
history.forEach(entry => {
  console.log(`${entry.timestamp}: ${entry.type} - ${JSON.stringify(entry.data)}`);
});
```

#### `clearHistory(): void`

Clears all conversation history and behavior tracking data.

**Example:**
```typescript
agent.clearHistory();
console.log(agent.getHistory().length); // 0
```

#### `setSystemPrompt(prompt: string): void`

Updates the agent's system prompt.

**Parameters:**
- `prompt: string` - New system prompt

**Example:**
```typescript
agent.setSystemPrompt('You are now a math tutor specializing in algebra.');
```

#### `setMaxIterations(max: number): void`

Sets the maximum number of tool-calling iterations per input.

**Parameters:**
- `max: number` - Maximum iterations (default: 10)

**Example:**
```typescript
agent.setMaxIterations(15); // Allow more complex multi-step reasoning
```

---

## Interfaces

### AgentConfig

Configuration object for creating an Agent.

```typescript
interface AgentConfig {
  name: string;                    // Required: Unique agent name
  llm?: LLM;                      // Optional: Custom LLM provider
  tools?: Tool[] | Function[] | any[];  // Optional: Array of tools
  systemPrompt?: string;          // Optional: System instruction
  apiKey?: string;                // Optional: OpenAI API key
  model?: string;                 // Optional: Model name (default: 'gpt-4o-mini')
  maxIterations?: number;         // Optional: Max tool iterations (default: 10)
  trust?: string | any;           // Optional: Trust relationship
}
```

**Field Details:**

- **`name`**: Unique identifier for the agent. Used for behavior tracking file paths.
- **`llm`**: Custom LLM provider implementing the `LLM` interface. Defaults to OpenAI.
- **`tools`**: Can be functions, class instances, or objects implementing the `Tool` interface.
- **`systemPrompt`**: Instructions that guide the agent's behavior and personality.
- **`apiKey`**: OpenAI API key. If not provided, uses `OPENAI_API_KEY` environment variable.
- **`model`**: OpenAI model name. Supports all chat completion models.
- **`maxIterations`**: Prevents infinite loops in tool calling scenarios.

### Tool

Interface for implementing custom tools with full control.

```typescript
interface Tool {
  name: string;
  description: string;
  run: (args: Record<string, any>) => Promise<any> | any;
  toFunctionSchema: () => FunctionSchema;
}
```

**Example Implementation:**
```typescript
const customTool: Tool = {
  name: 'process_data',
  description: 'Process data with custom logic',
  
  run: async (args: Record<string, any>) => {
    const { input, format } = args;
    // Your custom logic here
    return `Processed ${input} in ${format} format`;
  },
  
  toFunctionSchema: () => ({
    name: 'process_data',
    description: 'Process data with custom logic',
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string', description: 'Data to process' },
        format: { type: 'string', enum: ['json', 'xml', 'csv'] }
      },
      required: ['input', 'format']
    }
  })
};
```

### LLM

Interface for implementing custom LLM providers.

```typescript
interface LLM {
  complete(messages: Message[], tools?: FunctionSchema[]): Promise<LLMResponse>;
}
```

**Example Implementation:**
```typescript
class CustomLLM implements LLM {
  async complete(messages: Message[], tools?: FunctionSchema[]): Promise<LLMResponse> {
    // Your custom LLM integration
    const response = await yourCustomLLMCall(messages, tools);
    
    return {
      content: response.text,
      toolCalls: response.function_calls || [],
      rawResponse: response
    };
  }
}
```

### Message

Represents a message in the conversation history.

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;              // Tool name for tool messages
  tool_calls?: ToolCall[];    // For assistant messages with tool calls
  tool_call_id?: string;      // For tool response messages
}
```

### ToolCall

Represents a function call made by the LLM.

```typescript
interface ToolCall {
  name: string;               // Function name to call
  arguments: Record<string, any>;  // Function arguments
  id: string;                 // Unique call identifier
}
```

### LLMResponse

Response from an LLM provider.

```typescript
interface LLMResponse {
  content: string | null;     // Text response (null if only tool calls)
  toolCalls: ToolCall[];      // Array of tool calls to execute  
  rawResponse: any;           // Original provider response
}
```

### FunctionSchema

OpenAI-compatible function schema for tool definitions.

```typescript
interface FunctionSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}
```

**Example:**
```typescript
const schema: FunctionSchema = {
  name: 'get_weather',
  description: 'Get current weather for a city',
  parameters: {
    type: 'object',
    properties: {
      city: { type: 'string', description: 'City name' },
      units: { type: 'string', enum: ['celsius', 'fahrenheit'], default: 'fahrenheit' }
    },
    required: ['city']
  }
};
```

### BehaviorEntry

Represents an entry in the agent's behavior tracking history.

```typescript
interface BehaviorEntry {
  timestamp: string;          // ISO timestamp
  type: 'input' | 'llm_response' | 'tool_call' | 'output';
  data: any;                  // Entry-specific data
}
```

**Entry Types:**
- **`input`**: User message received
- **`llm_response`**: Response from LLM (may include tool calls)  
- **`tool_call`**: Tool execution with arguments and results
- **`output`**: Final response sent to user

### ToolResult

Result of a tool execution.

```typescript
interface ToolResult {
  status: 'success' | 'error' | 'not_found';
  result?: any;               // Tool output (if successful)
  error?: string;             // Error message (if failed)
}
```

---

## Types

### Supported Tool Types

ConnectOnion supports multiple ways to define tools:

#### 1. Function Tools
```typescript
function myTool(param1: string, param2: number): string {
  /** JSDoc description becomes tool description */
  return `Result: ${param1} - ${param2}`;
}

// TypeScript automatically generates the schema
```

#### 2. Class Instance Tools
```typescript
class MyService {
  private data = [];
  
  // Public methods become tools
  addItem(item: string): void {
    /** Add an item to the service */
    this.data.push(item);
  }
  
  // Private methods are NOT exposed as tools
  private helper(): void {
    // Internal logic
  }
}

const service = new MyService();
// All public methods become tools automatically
```

#### 3. Custom Tool Objects
```typescript
const customTool: Tool = {
  name: 'custom_action',
  description: 'Performs a custom action',
  run: async (args) => {
    // Implementation
  },
  toFunctionSchema: () => ({
    // Schema definition
  })
};
```

---

## LLM Providers

### Default OpenAI Provider

The default provider uses OpenAI's chat completion API.

```typescript
// Automatic - no configuration needed
const agent = new Agent({
  name: 'agent',
  apiKey: 'your-openai-key', // or set OPENAI_API_KEY env var
  model: 'gpt-4o-mini'       // or any OpenAI model
});
```

**Supported Models:**
- `gpt-4o-mini` (default, fast and cost-effective)
- `gpt-4o` (most capable)
- `gpt-4-turbo`
- `gpt-3.5-turbo`
- Any other OpenAI chat model

### Custom LLM Provider

Implement the `LLM` interface to use other providers:

```typescript
import { LLM, LLMResponse, Message, FunctionSchema } from 'connectonion-ts';

class AnthropicProvider implements LLM {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async complete(messages: Message[], tools?: FunctionSchema[]): Promise<LLMResponse> {
    // Integrate with Anthropic's API
    // Convert messages format, handle tools, etc.
    
    const response = await this.callAnthropicAPI(messages, tools);
    
    return {
      content: response.content,
      toolCalls: this.parseToolCalls(response),
      rawResponse: response
    };
  }
  
  private async callAnthropicAPI(messages: Message[], tools?: FunctionSchema[]): Promise<any> {
    // Your Anthropic API integration
  }
  
  private parseToolCalls(response: any): ToolCall[] {
    // Parse Anthropic's function calls to ConnectOnion format
  }
}

// Use with agent
const customLLM = new AnthropicProvider('your-anthropic-key');
const agent = new Agent({
  name: 'anthropic-agent',
  llm: customLLM
});
```

---

## Error Handling

ConnectOnion handles errors gracefully and provides detailed error information.

### Tool Execution Errors

When a tool throws an error:

```typescript
function riskyTool(input: string): string {
  if (!input) {
    throw new Error('Input is required');
  }
  return `Processed: ${input}`;
}

const agent = new Agent({ name: 'test', tools: [riskyTool] });

// The agent will receive the error and can handle it
const response = await agent.input('Call riskyTool with empty input');
// Agent might respond: "I encountered an error: Input is required"
```

### LLM Provider Errors

LLM errors are caught and handled:

```typescript
class FailingLLM implements LLM {
  async complete(messages: Message[]): Promise<LLMResponse> {
    throw new Error('API unavailable');
  }
}

const agent = new Agent({
  name: 'failing-agent',
  llm: new FailingLLM()
});

try {
  await agent.input('Hello');
} catch (error) {
  console.log('Agent failed:', error.message);
}
```

### Best Practices for Error Handling

1. **Graceful Tool Errors**: Let tools throw meaningful errors that the agent can understand and explain to users.

2. **Validate Inputs**: Check tool parameters and provide clear error messages.

```typescript
function validateAndProcess(email: string): string {
  if (!email.includes('@')) {
    throw new Error('Please provide a valid email address');
  }
  return `Processing email: ${email}`;
}
```

3. **Timeout Handling**: For long-running tools, implement timeouts.

```typescript
function longRunningTool(data: string): Promise<string> {
  return Promise.race([
    actualProcessing(data),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), 30000)
    )
  ]);
}
```

---

## Configuration

### Environment Variables

```bash
# Required for default OpenAI provider
OPENAI_API_KEY=your-openai-api-key

# Optional: Override default model
CONNECTONION_DEFAULT_MODEL=gpt-4o

# Optional: Custom behavior tracking location  
CONNECTONION_DATA_PATH=~/.connectonion
```

### Agent Configuration Examples

#### Minimal Configuration
```typescript
const agent = new Agent({ name: 'simple' });
```

#### Full Configuration
```typescript
const agent = new Agent({
  name: 'advanced-agent',
  tools: [tool1, tool2, serviceInstance],
  systemPrompt: `You are an expert assistant with access to specialized tools.
                 Always explain your reasoning and ask for clarification when needed.`,
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o',
  maxIterations: 15,
  llm: customLLMProvider
});
```

#### Production Configuration
```typescript
const agent = new Agent({
  name: 'production-agent',
  tools: [productionTools],
  systemPrompt: readFileSync('./prompts/system.txt', 'utf-8'),
  model: 'gpt-4o-mini', // Cost-effective for production
  maxIterations: 8,     // Prevent runaway costs
});

// Add error handling
agent.input(userMessage).catch(error => {
  console.error('Agent error:', error);
  // Fallback logic
});
```

### TypeScript Configuration

For best results, use these TypeScript compiler options:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

---

## Performance Tips

### 1. **Tool Design**
- Keep tools focused and single-purpose
- Use TypeScript types for better schema generation
- Add JSDoc comments for better tool descriptions

### 2. **Model Selection**
- Use `gpt-4o-mini` for most use cases (faster, cheaper)
- Use `gpt-4o` only when you need maximum reasoning capability
- Consider using different models for different agents

### 3. **Conversation Management**
- Clear history periodically for long-running agents
- Use meaningful agent names for better behavior tracking
- Set appropriate `maxIterations` based on your use case

### 4. **Tool Execution**
- Make tools idempotent when possible
- Handle errors gracefully within tools
- Use async tools for I/O operations

**Ready to dive deeper?** Check out the [Tools Guide](./tools.md) for advanced tool patterns and [Troubleshooting](./troubleshooting.md) for common issues and solutions.