/**
 * Basic Agent Example
 * Demonstrates creating a simple agent with custom tools
 */

import { Agent } from '../src';

// Define a simple calculator tool
function add(a: number, b: number): number {
  /** Add two numbers together */
  return a + b;
}

function multiply(a: number, b: number): number {
  /** Multiply two numbers */
  return a * b;
}

// Define a weather tool (mock implementation)
async function getWeather(city: string): Promise<string> {
  /** Get the current weather for a city */
  // Mock implementation - in real use, this would call a weather API
  return `The weather in ${city} is sunny and 72°F`;
}

async function main() {
  // Create an agent with tools
  const agent = new Agent({
    name: 'assistant',
    tools: [add, multiply, getWeather],
    systemPrompt: 'You are a helpful assistant that can do math and check weather.',
    // apiKey: 'your-openai-api-key', // Or set OPENAI_API_KEY env variable
  });

  // Example 1: Math calculation
  console.log('Example 1: Math calculation');
  const mathResponse = await agent.input('What is 25 plus 17, and then multiply the result by 3?');
  console.log('Response:', mathResponse);
  console.log('---');

  // Example 2: Weather query
  console.log('Example 2: Weather query');
  const weatherResponse = await agent.input('What\'s the weather like in New York?');
  console.log('Response:', weatherResponse);
  console.log('---');

  // Example 3: Combined query
  console.log('Example 3: Combined query');
  const combinedResponse = await agent.input(
    'If the temperature in San Francisco is 72 degrees, what would it be if it increased by 15 degrees?'
  );
  console.log('Response:', combinedResponse);
}

// Run the example
main().catch(console.error);