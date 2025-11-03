# 🚀 Getting Started with ConnectOnion TypeScript

Build your first AI agent in **60 seconds** - we timed it!

## Table of Contents
- [Installation](#installation)
- [Your First Agent](#your-first-agent)
- [Understanding Tools](#understanding-tools)
- [Configuration Options](#configuration-options)
- [Common Patterns](#common-patterns)
- [Next Steps](#next-steps)

## Installation

### Prerequisites
- Node.js 16+ installed
- TypeScript 4.5+ (optional, but recommended)
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

### Install the Package

```bash
# Using npm
npm install connectonion

# Using yarn
yarn add connectonion-ts

# Using pnpm
pnpm add connectonion-ts
```

### TypeScript Setup (if needed)

```bash
# Install TypeScript
npm install -D typescript @types/node

# Create tsconfig.json
npx tsc --init
```

Recommended `tsconfig.json`:
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
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

## Your First Agent

### Step 1: Set Your API Key

Create a `.env` file in your project root:

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

**Security Tip**: Add `.env` to your `.gitignore` file!

### Step 2: Create Your Agent

Create `src/my-agent.ts`:

```typescript
import { Agent } from 'connectonion';

// Define a tool - any function becomes a tool!
function greet(name: string): string {
  /**
   * Greet someone by name
   * The LLM reads this comment!
   */
  return `Hello, ${name}! Welcome to ConnectOnion!`;
}

function calculate(expression: string): number {
  /**
   * Safely evaluate a math expression
   */
  // In production, use a proper math parser!
  return eval(expression);
}

// Create your agent
const agent = new Agent({
  name: 'my-first-agent',
  tools: [greet, calculate],
  systemPrompt: 'You are a friendly assistant who loves to help!'
});

// Use your agent
async function main() {
  // Simple greeting
  const response1 = await agent.input('Say hello to Alice');
  console.log(response1);
  // Output: "Hello, Alice! Welcome to ConnectOnion!"

  // Math calculation
  const response2 = await agent.input('What is 42 times 17?');
  console.log(response2);
  // Output: "42 times 17 equals 714"

  // Multiple tools in one request
  const response3 = await agent.input(
    'Greet Bob and calculate 100 divided by 4'
  );
  console.log(response3);
  // Output: "Hello Bob! 100 divided by 4 equals 25"
}

main().catch(console.error);
```

### Step 3: Run Your Agent

```bash
# If using TypeScript
npx ts-node src/my-agent.ts

# Or compile and run
npx tsc
node dist/my-agent.js
```

**🎉 Congratulations!** You've built your first AI agent!

## Understanding Tools

### What Makes a Tool?

In ConnectOnion, **any function can be a tool**. The agent automatically:
- Extracts the function name
- Reads JSDoc comments as descriptions
- Understands parameters
- Knows when to call it

### Tool Examples

```typescript
// Simple tool - synchronous function
function getCurrentTime(): string {
  /** Get the current time */
  return new Date().toLocaleTimeString();
}

// Async tool - returns a Promise
async function fetchWeather(city: string): Promise<string> {
  /** Fetch weather for a city */
  const response = await fetch(`https://api.weather.com/${city}`);
  return await response.text();
}

// Tool with multiple parameters
function sendEmail(
  to: string,
  subject: string,
  body: string,
  urgent: boolean = false
): string {
  /** Send an email to someone */
  // Email logic here
  return `Email sent to ${to}`;
}

// Arrow function tool
const calculateAge = (birthYear: number): number => {
  /** Calculate age from birth year */
  return new Date().getFullYear() - birthYear;
};
```

### Class-Based Tools

Turn entire classes into tool sets:

```typescript
class FileManager {
  /**
   * Each public method becomes a tool!
   */
  
  readFile(path: string): string {
    /** Read contents of a file */
    return fs.readFileSync(path, 'utf-8');
  }
  
  writeFile(path: string, content: string): void {
    /** Write content to a file */
    fs.writeFileSync(path, content);
  }
  
  listFiles(directory: string): string[] {
    /** List all files in a directory */
    return fs.readdirSync(directory);
  }
  
  private helper(): void {
    // Private methods are NOT exposed as tools
  }
}

// Use the entire class as tools
const agent = new Agent({
  name: 'file-agent',
  tools: [new FileManager()], // All public methods become tools!
});
```

## Configuration Options

### Basic Configuration

```typescript
const agent = new Agent({
  // Required: unique name for behavior tracking
  name: 'my-agent',
  
  // Optional: array of tools (functions, classes, or Tool objects)
  tools: [tool1, tool2],
  
  // Optional: system prompt defining behavior
  systemPrompt: 'You are a helpful assistant',
  
  // Optional: OpenAI API key (uses env var if not provided)
  apiKey: 'sk-...',
  
  // Optional: model to use (default: 'gpt-4o-mini')
  model: 'gpt-4',
  
  // Optional: max iterations for tool calling (default: 10)
  maxIterations: 15
});
```

### Environment Variables

ConnectOnion automatically loads from `.env`:

```bash
# .env file
OPENAI_API_KEY=sk-your-key
DEFAULT_MODEL=gpt-4
MAX_ITERATIONS=20
```

### Using Different Models

```typescript
// Fast and cheap
const fastAgent = new Agent({
  name: 'fast',
  model: 'gpt-3.5-turbo'
});

// Powerful and smart
const smartAgent = new Agent({
  name: 'smart',
  model: 'gpt-4'
});

// Latest mini model (recommended for most use cases)
const efficientAgent = new Agent({
  name: 'efficient',
  model: 'gpt-4o-mini'  // Default
});
```

## Common Patterns

### Pattern 1: Database Agent

```typescript
import { Agent } from 'connectonion';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class DatabaseTools {
  async findUser(email: string) {
    return await prisma.user.findUnique({ where: { email } });
  }
  
  async createUser(email: string, name: string) {
    return await prisma.user.create({
      data: { email, name }
    });
  }
  
  async updateUser(id: number, data: any) {
    return await prisma.user.update({
      where: { id },
      data
    });
  }
}

const dbAgent = new Agent({
  name: 'database-assistant',
  tools: [new DatabaseTools()],
  systemPrompt: 'You help manage user data. Be careful with updates.'
});

// Natural language database operations
await dbAgent.input('Find the user with email john@example.com');
await dbAgent.input('Create a new user Alice with email alice@example.com');
```

### Pattern 2: API Integration Agent

```typescript
class APITools {
  private apiKey = process.env.API_KEY;
  
  async searchProducts(query: string) {
    const response = await fetch(`https://api.store.com/search?q=${query}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return await response.json();
  }
  
  async getProductDetails(productId: string) {
    const response = await fetch(`https://api.store.com/products/${productId}`);
    return await response.json();
  }
  
  async placeOrder(productId: string, quantity: number) {
    // Order placement logic
    return { orderId: '12345', status: 'confirmed' };
  }
}

const shopAgent = new Agent({
  name: 'shopping-assistant',
  tools: [new APITools()],
  systemPrompt: 'You are a helpful shopping assistant.'
});

// Natural shopping experience
await shopAgent.input('Find me the best wireless headphones under $200');
```

### Pattern 3: Multi-Tool Agent

```typescript
// Combine different tool sources
const agent = new Agent({
  name: 'multi-tool',
  tools: [
    // Individual functions
    calculateTax,
    formatCurrency,
    
    // Class instance (all methods become tools)
    new DatabaseTools(),
    
    // Another class instance
    new EmailService(),
    
    // Custom tool object
    {
      name: 'customTool',
      description: 'A custom tool',
      run: async (args) => { /* ... */ },
      toFunctionSchema: () => ({ /* ... */ })
    }
  ]
});
```

## Session & Trace

Agents keep an in-memory session (messages + tool execution trace):

```typescript
const agent = new Agent({ name: 'runtime-session' });
await agent.input('Hello!');
const { messages, trace } = agent.getSession();
console.log(`Messages: ${messages.length}, tool steps: ${trace.length}`);
// Clear the in-memory trace if needed
agent.clearHistory();
```

## Error Handling

```typescript
try {
  const response = await agent.input('Do something');
  console.log(response);
} catch (error) {
  if (error.message.includes('API key')) {
    console.error('Invalid API key');
  } else if (error.message.includes('rate limit')) {
    console.error('Rate limited, please wait');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Tool Error Handling

Tools that throw errors are handled gracefully:

```typescript
function riskyTool(input: string): string {
  if (!input) {
    throw new Error('Input is required!');
  }
  return `Processed: ${input}`;
}

const agent = new Agent({
  name: 'error-handler',
  tools: [riskyTool]
});

// Agent will handle the error and potentially retry or work around it
await agent.input('Use the risky tool');
```

## Next Steps

### 📚 Learn More
- [API Reference](./api.md) - Complete API documentation
- [Examples](./examples.md) - Real-world examples
- [Tool System](./tools.md) - Deep dive into tools
- [Troubleshooting](./troubleshooting.md) - Common issues

### 🎯 Best Practices

1. **Name your agents clearly** - The name is used for behavior tracking
2. **Write descriptive comments** - They become tool descriptions
3. **Handle errors in tools** - Return error messages rather than throwing
4. **Use appropriate models** - gpt-4o-mini for most tasks, gpt-4 for complex reasoning
5. **Set reasonable iterations** - Simple tasks: 5-10, Complex tasks: 15-30

### 🚀 Build Something Amazing!

Now that you understand the basics, try building:
- A customer service bot
- A data analysis assistant  
- A code review agent
- A content generator
- A DevOps automation tool

The possibilities are endless! 🌟

---

<p align="center">
  <strong>Need help?</strong> Check our <a href="./troubleshooting.md">Troubleshooting Guide</a> or <a href="https://discord.gg/4xfD9k8AUF">join our Discord</a>
</p>
