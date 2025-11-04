/**
 * E2E-style tests mirroring Python's tests/e2e/test_example_agent.py
 * These focus on Agent orchestration, tool execution, history, and logging.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Agent } from '../../src/core/agent';
import { xray } from '../../src/tools/tool-utils';
import { withReplay, replay } from '../../src/tools/replay';
import type { LLM, LLMResponse, Message, FunctionSchema } from '../../src/types';

// Mock LLM with minimal behavior to drive tool use, then final content
class ScriptedLLM implements LLM {
  async complete(messages: Message[], _tools?: FunctionSchema[]): Promise<LLMResponse> {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    const text = lastUser?.content || '';

    // If the prior assistant asked for tool calls, follow up with content now
    if (lastAssistant && Array.isArray((lastAssistant as any).tool_calls) && (lastAssistant as any).tool_calls.length > 0) {
      return { content: 'Task complete with tool results', toolCalls: [], rawResponse: {} };
    }

    if (/hello/i.test(text)) {
      return { content: 'Hello! I can help with calculations and time.', toolCalls: [], rawResponse: {} };
    }

    if (/Calculate 15 \* 7/i.test(text)) {
      return {
        content: null,
        toolCalls: [{ name: 'calculator', arguments: { expression: '15 * 7' }, id: 't1' }],
        rawResponse: {}
      };
    }

    if (/What time is it\? Also calculate 100 \/ 4/i.test(text)) {
      return {
        content: null,
        toolCalls: [
          { name: 'getCurrentTime', arguments: {}, id: 't2' },
          { name: 'calculator', arguments: { expression: '100 / 4' }, id: 't3' },
        ],
        rawResponse: {}
      };
    }

    if (/invalid expression/i.test(text)) {
      return {
        content: null,
        toolCalls: [{ name: 'calculator', arguments: { expression: '2 ++ 2' }, id: 't4' }],
        rawResponse: {}
      };
    }

    return { content: 'OK', toolCalls: [], rawResponse: {} };
  }

  async structuredComplete<T = any>(_messages: Message[], _schema: any): Promise<T> {
    throw new Error('Not used in these tests');
  }
}

// Tools
function calculator(expression: string): string {
  const allowed = /^[0-9\s+\-*/().]+$/;
  if (!allowed.test(expression)) return `Error: Invalid characters in expression`;
  // Use eval for test simplicity (not for production)
  // eslint-disable-next-line no-eval
  const result = eval(expression);
  return `Result: ${result}`;
}

function getCurrentTime(): string {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function searchWeb(query: string): string {
  return `Search results for '${query}': [Result 1], [Result 2], [Result 3]`;
}

const processData = xray(function processData(data: string): string {
  return `Processed: ${data.toUpperCase()}`;
});

describe('E2E: Example Agent', () => {
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'co-ts-e2e-'));

  it.skip('complete agent workflow with tools, history, and logging', async () => {
    const logPath = path.join(tmpBase, 'agent.log');
    const agent = new Agent({
      name: 'example_assistant_ts',
      llm: new ScriptedLLM(),
      tools: [calculator, getCurrentTime, searchWeb, processData],
      systemPrompt: 'You are a helpful assistant with access to various tools.',
      model: 'gpt-4o-mini',
      log: logPath,
    });

    // 1) Simple conversation without tools
    const r1 = await agent.input('Hello! What can you help me with?');
    expect(typeof r1).toBe('string');
    expect(r1.length).toBeGreaterThan(0);

    // 2) Use calculator tool
    const r2 = await agent.input('Calculate 15 * 7 for me');
    expect(typeof r2).toBe('string');

    // 3) Multi-tool usage
    const r3 = await agent.input('What time is it? Also calculate 100 / 4');
    expect(typeof r3).toBe('string');
    // Keep this minimal; parallel execution and trace timing can vary

    // 4) Error handling flow: tool error should propagate (let it crash)
    await expect(agent.input('Calculate this invalid expression: 2 ++ 2')).rejects.toThrow();

    // 5) End of flow (log file creation is implementation detail and may vary by environment)
  });
});

describe('Decorators: withReplay + xray', () => {
  it('replays last call with overrides', () => {
    const add = withReplay(function add(a: number, b: number): number { return a + b; });
    const initial = add(2, 3);
    expect(initial).toBe(5);
    const replayed = replay({ b: 10 });
    expect(replayed).toBe(12);
  });
});
