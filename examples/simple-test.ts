/**
 * Simple Test Example
 * Tests the agent with actual OpenAI API
 */

import { Agent } from '../src';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define a simple calculator tool
function add(a: number, b: number): number {
  /** Add two numbers together */
  return a + b;
}

function multiply(a: number, b: number): number {
  /** Multiply two numbers */
  return a * b;
}

async function main() {
  console.log('Creating agent with OpenAI integration...');
  
  try {
    // Create an agent with tools
    const agent = new Agent({
      name: 'calculator',
      tools: [add, multiply],
      systemPrompt: 'You are a helpful calculator assistant. Use the provided tools to solve math problems.',
      model: 'gpt-4o-mini'
    });

    console.log('Agent created successfully!');
    console.log('Available tools:', agent.getTools().map(t => t.name).join(', '));
    console.log('\nTesting calculation...');
    
    // Test a simple calculation
    const response = await agent.input('What is 15 plus 27, and then multiply the result by 2?');
    console.log('\nAgent response:', response);
    
    // Inspect session
    const { messages, trace } = agent.getSession();
    console.log('\nSession:', { messages: messages.length, trace: trace.length });
    
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);
