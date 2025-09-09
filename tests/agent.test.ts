/**
 * Tests for Agent class
 */

import { Agent } from '../src/core/agent';
import { LLM, LLMResponse, Message, FunctionSchema } from '../src/types';

// Mock LLM for testing
class MockLLM implements LLM {
  private responses: LLMResponse[] = [];
  private callCount = 0;

  constructor(responses: LLMResponse[]) {
    this.responses = responses;
  }

  async complete(_messages: Message[], _tools?: FunctionSchema[]): Promise<LLMResponse> {
    const response = this.responses[this.callCount] || {
      content: 'Default response',
      toolCalls: [],
      rawResponse: {}
    };
    this.callCount++;
    return response;
  }
}

describe('Agent', () => {
  it('should create an agent with basic configuration', () => {
    const agent = new Agent({
      name: 'test-agent',
      systemPrompt: 'You are a test agent'
    });

    expect(agent).toBeDefined();
    expect(agent.getTools()).toEqual([]);
  });

  it('should process function tools', () => {
    function testTool(): string {
      return 'test';
    }

    const agent = new Agent({
      name: 'test-agent',
      tools: [testTool]
    });

    const tools = agent.getTools();
    expect(tools.length).toBe(1);
    expect(tools[0].name).toBe('testTool');
  });

  it('should handle simple text responses', async () => {
    const mockLLM = new MockLLM([
      {
        content: 'Hello, I am a test response',
        toolCalls: [],
        rawResponse: {}
      }
    ]);

    const agent = new Agent({
      name: 'test-agent',
      llm: mockLLM
    });

    const response = await agent.input('Hello');
    expect(response).toBe('Hello, I am a test response');
  });

  it('should execute tool calls', async () => {
    let toolCalled = false;
    
    function testTool(message: string): string {
      toolCalled = true;
      return `Tool response: ${message}`;
    }

    const mockLLM = new MockLLM([
      {
        content: null,
        toolCalls: [{
          name: 'testTool',
          arguments: { message: 'test message' },
          id: 'call_1'
        }],
        rawResponse: {}
      },
      {
        content: 'Final response after tool call',
        toolCalls: [],
        rawResponse: {}
      }
    ]);

    const agent = new Agent({
      name: 'test-agent',
      llm: mockLLM,
      tools: [testTool]
    });

    const response = await agent.input('Please use the tool');
    
    expect(toolCalled).toBe(true);
    expect(response).toBe('Final response after tool call');
  });

  it('should handle tool errors gracefully', async () => {
    function errorTool(): string {
      throw new Error('Tool error');
    }

    const mockLLM = new MockLLM([
      {
        content: null,
        toolCalls: [{
          name: 'errorTool',
          arguments: {},
          id: 'call_1'
        }],
        rawResponse: {}
      },
      {
        content: 'Handled the error',
        toolCalls: [],
        rawResponse: {}
      }
    ]);

    const agent = new Agent({
      name: 'test-agent',
      llm: mockLLM,
      tools: [errorTool]
    });

    const response = await agent.input('Use the error tool');
    expect(response).toBe('Handled the error');
  });

  it('should add and remove tools dynamically', () => {
    const agent = new Agent({
      name: 'test-agent'
    });

    function newTool(): string {
      return 'new';
    }

    expect(agent.getTools().length).toBe(0);

    agent.addTool(newTool);
    expect(agent.getTools().length).toBe(1);
    expect(agent.getTools()[0].name).toBe('newTool');

    const removed = agent.removeTool('newTool');
    expect(removed).toBe(true);
    expect(agent.getTools().length).toBe(0);

    const removedAgain = agent.removeTool('newTool');
    expect(removedAgain).toBe(false);
  });

  it('should respect max iterations', async () => {
    const mockLLM = new MockLLM([
      // This would normally create an infinite loop
      ...Array(20).fill({
        content: null,
        toolCalls: [{
          name: 'nonExistentTool',
          arguments: {},
          id: 'call_1'
        }],
        rawResponse: {}
      })
    ]);

    const agent = new Agent({
      name: 'test-agent',
      llm: mockLLM,
      maxIterations: 3
    });

    const response = await agent.input('Keep calling tools');
    // Should stop after 3 iterations
    expect(response).toBe('');
  });
});