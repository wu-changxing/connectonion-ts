/**
 * Test migrated features from Python to TypeScript
 *
 * This file tests:
 * - TYPE_MAP in tool-utils.ts
 * - executeSingleTool() in tool-executor.ts
 * - Xray context injection in xray.ts
 */

import { createToolFromFunction } from '../src/tools/tool-utils';
import { executeSingleTool } from '../src/tools/tool-executor';
import { Console } from '../src/console';
import { injectXrayContext, clearXrayContext, getXrayContext } from '../src/tools/xray';

// Test 1: TYPE_MAP - Type detection
console.log('=== Test 1: TYPE_MAP Type Detection ===\n');

function testTypes(name: string, age: number, active: boolean, tags: string[]): string {
  return `${name} is ${age} years old`;
}

const tool1 = createToolFromFunction(testTypes);
const schema1 = tool1.toFunctionSchema();
console.log('Function: testTypes(name: string, age: number, active: boolean, tags: string[])');
console.log('Function source:', testTypes.toString());
console.log('Generated Schema:', JSON.stringify(schema1.parameters, null, 2));
console.log('✓ Note: TypeScript types are erased at runtime, so type extraction is limited');
console.log('  For better type detection, consider using TypeScript decorators or metadata\n');

// Test 2: executeSingleTool - Standalone execution
console.log('=== Test 2: executeSingleTool() ===\n');

function multiply(a: number, b: number): number {
  return a * b;
}

const tool2 = createToolFromFunction(multiply);
const toolMap = new Map();
toolMap.set('multiply', tool2);

const mockAgent = {
  currentIteration: 1,
  trace: []
};

const console2 = new Console();

async function testExecuteSingleTool() {
  const traceEntry = await executeSingleTool(
    'multiply',
    { a: 5, b: 7 },
    'test_call_1',
    toolMap,
    mockAgent,
    console2
  );

  console.log('\nTrace Entry:');
  console.log(`  tool_name: ${traceEntry.tool_name}`);
  console.log(`  arguments: ${JSON.stringify(traceEntry.arguments)}`);
  console.log(`  result: ${traceEntry.result}`);
  console.log(`  status: ${traceEntry.status}`);
  console.log(`  timing: ${traceEntry.timing}ms`);
  console.log('✓ Expected: result=35, status=success\n');
}

testExecuteSingleTool();

// Test 3: Xray context injection
console.log('=== Test 3: Xray Context Injection ===\n');

const mockAgent2 = {
  name: 'test-agent'
};

injectXrayContext(
  mockAgent2,
  'Calculate 5 times 7',
  [{ role: 'user', content: 'test' }],
  1,
  ['add', 'subtract']
);

const context = getXrayContext();
console.log('Injected Context:');
console.log(`  agent: ${context.agent?.name}`);
console.log(`  task: ${context.task}`);
console.log(`  iteration: ${context.iteration}`);
console.log(`  previousTools: ${context.previousTools.join(', ')}`);

clearXrayContext();
const clearedContext = getXrayContext();
console.log('\nAfter clearing:');
console.log(`  agent: ${clearedContext.agent}`);
console.log('✓ Expected: agent=null after clearing\n');

console.log('=== All Tests Complete ===');
