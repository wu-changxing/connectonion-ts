# 🚀 ConnectOnion TypeScript SDK

> **Build AI agents that actually DO things** - Zero boilerplate, maximum power

[![npm version](https://img.shields.io/npm/v/connectonion-ts.svg)](https://www.npmjs.com/package/connectonion-ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ What is ConnectOnion?

ConnectOnion is a TypeScript SDK that makes building AI agents ridiculously simple. Your functions become tools. Your classes become toolsets. Your agents just work.

```typescript
// This is all you need for a working AI agent
import { Agent } from 'connectonion-ts';

function calculateTip(bill: number, percentage: number): number {
  return bill * (percentage / 100);
}

const agent = new Agent({
  name: 'assistant',
  tools: [calculateTip]  // Your function is now an AI tool!
});

const response = await agent.input('What\'s a 20% tip on $85?');
// "A 20% tip on $85 would be $17.00"
```

**That's it.** No schemas. No configurations. No boilerplate.

## 🎯 Why ConnectOnion?

### 🧠 **Smart by Default**
- Agents automatically understand when and how to use tools
- Built-in conversation memory and context management
- Parallel tool execution for maximum efficiency

### 🛠️ **Any Function is a Tool**
```typescript
// These all become tools automatically
function sendEmail(to: string, subject: string) { }
async function fetchWeather(city: string) { }
const calculate = (x: number, y: number) => x + y;

// Even class methods!
class Database {
  query(sql: string) { }
  insert(table: string, data: any) { }
}
```

### 📝 **TypeScript Superpowers**
- Full type safety and IntelliSense support
- Compile-time parameter validation
- Auto-completion for all APIs
- JSDoc comments become tool descriptions

### 💾 **Automatic Behavior Tracking**
Every action is recorded to `~/.connectonion/agents/{name}/behavior.json`

## 🚀 Quick Start (60 seconds)

### 1. Install
```bash
npm install connectonion-ts
# or
yarn add connectonion-ts
# or
pnpm add connectonion-ts
```

### 2. Set API Key
```bash
export OPENAI_API_KEY=sk-...
# or use .env file
```

### 3. Create Your First Agent
```typescript
import { Agent } from 'connectonion-ts';

// Define what your agent can do
function searchWeb(query: string): string {
  // Your search logic here
  return `Results for ${query}...`;
}

function sendMessage(to: string, message: string): string {
  // Your messaging logic here
  return `Message sent to ${to}`;
}

// Create the agent
const agent = new Agent({
  name: 'personal-assistant',
  tools: [searchWeb, sendMessage],
  systemPrompt: 'You are a helpful personal assistant.'
});

// Use it!
const response = await agent.input(
  'Search for TypeScript tutorials and send the link to John'
);
```

## 🎨 Real-World Examples

### Example 1: Customer Service Bot
```typescript
class CustomerService {
  // Each method becomes a tool automatically
  async lookupOrder(orderId: string): Promise<Order> {
    return await db.orders.findOne({ id: orderId });
  }

  async processRefund(orderId: string, reason: string): Promise<RefundResult> {
    const order = await this.lookupOrder(orderId);
    return await payments.refund(order, reason);
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    await emailService.send({ to, subject, body });
  }
}

// Create an agent with all methods as tools
const agent = new Agent({
  name: 'customer-service',
  tools: [new CustomerService()],  // All methods become tools!
  systemPrompt: 'You are a helpful customer service representative.'
});

// Handle customer requests naturally
const response = await agent.input(
  'Order #12345 arrived damaged, I want a refund'
);
// Agent will: lookup order → process refund → send confirmation email
```

### Example 2: Data Analysis Agent
```typescript
import { Agent } from 'connectonion-ts';
import * as fs from 'fs';
import * as csv from 'csv-parse';

// Tools for data analysis
function readCSV(filepath: string): any[] {
  const data = fs.readFileSync(filepath, 'utf-8');
  return csv.parse(data, { columns: true });
}

function analyzeData(data: any[], column: string): Statistics {
  // Statistical analysis logic
  return {
    mean: calculateMean(data, column),
    median: calculateMedian(data, column),
    stdDev: calculateStdDev(data, column)
  };
}

function createChart(data: any[], type: string): string {
  // Chart generation logic
  return `chart_${Date.now()}.png`;
}

// Create the analyst
const analyst = new Agent({
  name: 'data-analyst',
  tools: [readCSV, analyzeData, createChart],
  model: 'gpt-4', // Use GPT-4 for complex analysis
  systemPrompt: 'You are an expert data analyst. Provide insights and visualizations.'
});

// Analyze data with natural language
const report = await analyst.input(
  'Analyze sales.csv, focus on Q4 performance, and create a bar chart'
);
```

### Example 3: DevOps Automation
```typescript
class DevOpsTools {
  async deployToProduction(service: string, version: string) {
    // Kubernetes deployment logic
    return `Deployed ${service}:${version} to production`;
  }

  async checkSystemHealth(service: string) {
    // Health check logic
    return { status: 'healthy', uptime: '99.9%' };
  }

  async rollback(service: string) {
    // Rollback logic
    return `Rolled back ${service} to previous version`;
  }

  async queryLogs(service: string, timeRange: string, filter?: string) {
    // Log querying logic
    return [`[ERROR] Connection timeout`, `[WARN] High memory usage`];
  }
}

const devops = new Agent({
  name: 'devops-assistant',
  tools: [new DevOpsTools()],
  maxIterations: 20, // Complex operations might need more iterations
  systemPrompt: 'You are a DevOps expert. Be cautious with production changes.'
});

// Natural language DevOps
await devops.input(
  'Check if api-service is healthy, if not check logs and consider rollback'
);
```

## 🔧 Advanced Features

### Dynamic Tool Management
```typescript
// Add tools at runtime
agent.addTool(newFunction);

// Remove tools
agent.removeTool('oldToolName');

// List available tools
const tools = agent.getTools();
console.log(tools.map(t => `${t.name}: ${t.description}`));
```

### Custom LLM Providers
```typescript
import { LLM, Agent } from 'connectonion-ts';

class CustomLLM implements LLM {
  async complete(messages, tools) {
    // Your LLM implementation
    return { content: '...', toolCalls: [], rawResponse: {} };
  }
}

const agent = new Agent({
  name: 'custom-agent',
  llm: new CustomLLM()
});
```

### Conversation History
```typescript
// Access complete history
const history = agent.getHistory();

// Filter specific events
const toolCalls = history.filter(h => h.type === 'tool_call');
const errors = toolCalls.filter(t => t.data.result.status === 'error');

// Clear history when needed
agent.clearHistory();
```

### Override Iterations for Complex Tasks
```typescript
// Simple task - use default
await agent.input('What is 2+2?');

// Complex multi-step task - allow more iterations
await agent.input(
  'Analyze all CSV files, generate reports, and email summaries',
  30 // Allow up to 30 iterations
);
```

## 📚 Documentation

- **[Getting Started Guide](docs/getting-started.md)** - Complete setup walkthrough
- **[API Reference](docs/api.md)** - Full API documentation
- **[Examples](docs/examples.md)** - More real-world examples
- **[Tool System](docs/tools.md)** - Deep dive into tools
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues & solutions

## 🏗️ Project Structure

```
your-project/
├── src/
│   ├── agents/        # Your agent definitions
│   ├── tools/         # Custom tool implementations
│   └── index.ts       # Main entry point
├── .env               # API keys (never commit!)
├── package.json
└── tsconfig.json
```

## 🤝 Contributing

We love contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup
```bash
# Clone the repo
git clone https://github.com/connectonion/connectonion-ts
cd connectonion-ts

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## 📄 License

MIT © [ConnectOnion Team](https://github.com/connectonion)

## 🔗 Links

- **[Python Version](https://github.com/connectonion/connectonion)** - Original Python SDK
- **[Discord Community](https://discord.gg/connectonion)** - Get help & share ideas
- **[Blog](https://connectonion.com/blog)** - Tutorials and updates

## 🌟 Why TypeScript?

While our Python SDK is great, TypeScript offers unique advantages:

- **Type Safety**: Catch errors at compile time
- **IDE Support**: Unmatched IntelliSense and auto-completion
- **Modern Async**: Native async/await and Promise handling
- **NPM Ecosystem**: Access to millions of packages
- **Browser Ready**: Build agents that run in browsers (coming soon!)

---

<p align="center">
  Built with ❤️ by developers, for developers
</p>

<p align="center">
  <a href="https://github.com/connectonion/connectonion-ts">⭐ Star us on GitHub</a>
</p>