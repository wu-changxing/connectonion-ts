/**
 * Comprehensive test to verify all ConnectOnion functionality
 * This tests core logic, error handling, and edge cases
 */

import { Agent, createToolFromFunction, extractMethodsFromInstance, processTools } from '../src';
import * as dotenv from 'dotenv';

dotenv.config();

// Test counters
let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ ${message}`);
    testsFailed++;
  }
}

async function testBasicToolConversion() {
  console.log('\n🧪 Testing Basic Tool Conversion...');
  
  // Test 1: Simple function conversion
  function add(a: number, b: number): number {
    return a + b;
  }
  
  const tool = createToolFromFunction(add);
  assert(tool.name === 'add', 'Tool name should be "add"');
  assert(tool.description === 'Execute the add tool.', 'Default description should be set');
  
  const result = tool.run({ a: 5, b: 3 });
  assert(result === 8, 'Tool should calculate 5 + 3 = 8');
  
  // Test 2: Function with JSDoc
  function multiply(x: number, y: number): number {
    /** Multiply two numbers */
    return x * y;
  }
  
  const tool2 = createToolFromFunction(multiply);
  const schema = tool2.toFunctionSchema();
  assert(schema.name === 'multiply', 'Schema name should match function name');
  assert(schema.parameters.properties.hasOwnProperty('x'), 'Should have parameter x');
  assert(schema.parameters.properties.hasOwnProperty('y'), 'Should have parameter y');
}

async function testClassTools() {
  console.log('\n🧪 Testing Class-based Tools...');
  
  class Calculator {
    private state: number = 0;
    
    add(value: number): number {
      this.state += value;
      return this.state;
    }
    
    subtract(value: number): number {
      this.state -= value;
      return this.state;
    }
    
    getState(): number {
      return this.state;
    }
    
    private _reset(): void {
      this.state = 0;
    }
  }
  
  const calc = new Calculator();
  const tools = extractMethodsFromInstance(calc);
  
  assert(tools.length === 3, 'Should extract 3 public methods (not private ones)');
  assert(tools.some(t => t.name === 'add'), 'Should have add method');
  assert(tools.some(t => t.name === 'subtract'), 'Should have subtract method');
  assert(!tools.some(t => t.name === '_reset'), 'Should not extract private methods');
  
  // Test that methods maintain context
  const addTool = tools.find(t => t.name === 'add');
  const stateTool = tools.find(t => t.name === 'getState');
  
  if (addTool && stateTool) {
    addTool.run({ value: 10 });
    const state = stateTool.run({});
    assert(state === 10, 'Methods should maintain class instance context');
  }
}

async function testAgentCreation() {
  console.log('\n🧪 Testing Agent Creation...');
  
  try {
    // Test without API key should throw
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    
    let errorThrown = false;
    try {
      new Agent({ name: 'test' });
    } catch (e) {
      errorThrown = true;
    }
    assert(errorThrown, 'Should throw error when no API key is provided');
    
    // Restore key
    process.env.OPENAI_API_KEY = originalKey;
    
    // Test with API key
    const agent = new Agent({
      name: 'test-agent',
      systemPrompt: 'Test prompt',
      maxIterations: 5
    });
    
    assert(agent.getTools().length === 0, 'Agent should start with no tools');
    
    // Test adding tools
    function testTool(): string {
      return 'test';
    }
    
    agent.addTool(testTool);
    assert(agent.getTools().length === 1, 'Should have 1 tool after adding');
    
    // Test removing tools
    agent.removeTool('testTool');
    assert(agent.getTools().length === 0, 'Should have 0 tools after removing');
    
  } catch (error) {
    console.error('Agent creation test error:', error);
  }
}

async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...');
  
  // Test tool that throws error
  function errorTool(): string {
    throw new Error('Tool error!');
  }
  
  const agent = new Agent({
    name: 'error-test',
    tools: [errorTool]
  });
  
  // Test that agent handles tool errors gracefully
  try {
    // We can't test actual LLM calls without mocking, but we can test tool execution
    const tool = agent.getTools()[0];
    let errorCaught = false;
    
    try {
      tool.run({});
    } catch (e) {
      errorCaught = true;
    }
    
    assert(errorCaught, 'Tool.run should throw errors for the agent to handle');
  } catch (error) {
    console.error('Error handling test failed:', error);
  }
}

async function testProcessTools() {
  console.log('\n🧪 Testing processTools Utility...');
  
  function func1(): string { return 'func1'; }
  function func2(): string { return 'func2'; }
  
  class TestClass {
    method1(): string { return 'method1'; }
    method2(): string { return 'method2'; }
  }
  
  // Test single function
  let tools = processTools(func1);
  assert(tools.length === 1, 'Single function should produce 1 tool');
  
  // Test array of functions
  tools = processTools([func1, func2]);
  assert(tools.length === 2, 'Array of 2 functions should produce 2 tools');
  
  // Test class instance
  tools = processTools(new TestClass());
  assert(tools.length === 2, 'Class with 2 methods should produce 2 tools');
  
  // Test mixed array
  tools = processTools([func1, new TestClass(), func2]);
  assert(tools.length === 4, 'Mixed array should produce correct number of tools');
  
  // Test empty input
  tools = processTools(null);
  assert(tools.length === 0, 'Null input should produce empty array');
  
  tools = processTools(undefined);
  assert(tools.length === 0, 'Undefined input should produce empty array');
}

async function testSessionTrace() {
  console.log('\n🧪 Testing Session & Trace...');
  const agent = new Agent({ name: 'session-test-' + Date.now() });
  const { messages, trace } = agent.getSession();
  assert(Array.isArray(messages), 'Session messages available');
  assert(Array.isArray(trace), 'Session trace available');
  agent.clearHistory();
}

async function testToolWithOptionalParams() {
  console.log('\n🧪 Testing Tools with Optional Parameters...');
  
  function greet(name: string, title?: string): string {
    return title ? `Hello, ${title} ${name}` : `Hello, ${name}`;
  }
  
  const tool = createToolFromFunction(greet);
  const schema = tool.toFunctionSchema();
  
  assert(schema.parameters.required?.includes('name'), 'name should be required');
  assert(!schema.parameters.required?.includes('title'), 'title should not be required');
  
  // Test execution with and without optional param
  const result1 = tool.run({ name: 'Alice' });
  assert(result1 === 'Hello, Alice', 'Should work without optional param');
  
  const result2 = tool.run({ name: 'Alice', title: 'Dr.' });
  assert(result2 === 'Hello, Dr. Alice', 'Should work with optional param');
}

async function testAsyncTools() {
  console.log('\n🧪 Testing Async Tools...');
  
  async function asyncTool(delay: number): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, delay));
    return `Waited ${delay}ms`;
  }
  
  const tool = createToolFromFunction(asyncTool);
  const result = await tool.run({ delay: 10 });
  assert(result === 'Waited 10ms', 'Async tool should work correctly');
}

async function testToolNaming() {
  console.log('\n🧪 Testing Tool Naming...');
  
  // Test regular function
  function myFunction(): void {}
  let tool = createToolFromFunction(myFunction);
  assert(tool.name === 'myFunction', 'Regular function name should be preserved');
  
  // Test arrow function with name
  const namedArrow = function arrowFunc(): void {};
  tool = createToolFromFunction(namedArrow);
  assert(tool.name === 'arrowFunc', 'Named arrow function should preserve name');
  
  // Test anonymous function
  tool = createToolFromFunction(function(): void {});
  assert(tool.name === 'anonymous', 'Anonymous function should be named "anonymous"');
}

async function testEdgeCases() {
  console.log('\n🧪 Testing Edge Cases...');
  
  // Test function with no parameters
  function noParams(): string {
    return 'no params';
  }
  
  const tool1 = createToolFromFunction(noParams);
  const result1 = tool1.run({});
  assert(result1 === 'no params', 'Function with no params should work');
  
  // Test function returning different types
  function returnObject(): object {
    return { key: 'value' };
  }
  
  const tool2 = createToolFromFunction(returnObject);
  const result2 = tool2.run({});
  assert(typeof result2 === 'object' && result2.key === 'value', 'Should handle object return');
  
  // Test function returning null
  function returnNull(): null {
    return null;
  }
  
  const tool3 = createToolFromFunction(returnNull);
  const result3 = tool3.run({});
  assert(result3 === null, 'Should handle null return');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive ConnectOnion Tests\n');
  console.log('=' .repeat(50));
  
  try {
    await testBasicToolConversion();
    await testClassTools();
    await testAgentCreation();
    await testErrorHandling();
    await testProcessTools();
    await testHistoryTracking();
    await testToolWithOptionalParams();
    await testAsyncTools();
    await testToolNaming();
    await testEdgeCases();
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    testsFailed++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! The SDK is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);
