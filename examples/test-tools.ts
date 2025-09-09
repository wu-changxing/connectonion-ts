/**
 * Test Tools Example
 * Tests the tool system without making real API calls
 */

import { createToolFromFunction, extractMethodsFromInstance, processTools } from '../src';

// Test function tool conversion
function testFunctionTool() {
  console.log('Testing Function Tool Conversion:');
  
  function add(a: number, b: number): number {
    /** Add two numbers together */
    return a + b;
  }
  
  const tool = createToolFromFunction(add);
  
  console.log('Tool name:', tool.name);
  console.log('Tool description:', tool.description);
  console.log('Tool schema:', JSON.stringify(tool.toFunctionSchema(), null, 2));
  
  // Test execution
  const result = tool.run({ a: 5, b: 3 });
  console.log('Execution result (5 + 3):', result);
  console.log('---');
}

// Test class method extraction
function testClassMethods() {
  console.log('Testing Class Method Extraction:');
  
  class Calculator {
    add(a: number, b: number): number {
      return a + b;
    }
    
    multiply(a: number, b: number): number {
      return a * b;
    }
    
    private helperMethod(): void {
      // Should not be extracted
    }
  }
  
  const calc = new Calculator();
  const tools = extractMethodsFromInstance(calc);
  
  console.log('Extracted tools count:', tools.length);
  tools.forEach(tool => {
    console.log(`- ${tool.name}: ${tool.description}`);
  });
  
  // Test execution
  if (tools.length > 0) {
    const addTool = tools.find(t => t.name === 'add');
    if (addTool) {
      const result = addTool.run({ a: 10, b: 20 });
      console.log('Add tool result (10 + 20):', result);
    }
  }
  console.log('---');
}

// Test processTools
function testProcessTools() {
  console.log('Testing Process Tools:');
  
  function func1(): string {
    return 'func1';
  }
  
  class TestClass {
    method1(): string {
      return 'method1';
    }
  }
  
  const instance = new TestClass();
  
  const tools = processTools([func1, instance]);
  console.log('Processed tools count:', tools.length);
  tools.forEach(tool => {
    console.log(`- ${tool.name}`);
  });
  console.log('---');
}

// Run all tests
console.log('=== ConnectOnion TypeScript SDK Tool Tests ===\n');
testFunctionTool();
testClassMethods();
testProcessTools();
console.log('=== Tests Complete ===');