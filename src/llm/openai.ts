/**
 * OpenAI LLM implementation for ConnectOnion TypeScript SDK
 */

import OpenAI from 'openai';
import { LLM, LLMResponse, Message, FunctionSchema, ToolCall } from '../types';

export class OpenAILLM implements LLM {
  private client: OpenAI;
  private model: string;

  constructor(apiKey?: string, model: string = 'gpt-4o-mini') {
    const key = apiKey || process.env.OPENAI_API_KEY;
    
    if (!key) {
      throw new Error(
        'OpenAI API key required. Set OPENAI_API_KEY environment variable or pass apiKey parameter.'
      );
    }

    this.client = new OpenAI({ apiKey: key });
    this.model = model;
  }

  async complete(messages: Message[], tools?: FunctionSchema[]): Promise<LLMResponse> {
    const openAIMessages = this.convertMessages(messages);
    
    const params: any = {
      model: this.model,
      messages: openAIMessages,
    };

    if (tools && tools.length > 0) {
      params.tools = tools.map(tool => ({
        type: 'function',
        function: tool,
      }));
      params.tool_choice = 'auto';
    }

    const response = await this.client.chat.completions.create(params);
    const message = response.choices[0].message;

    // Parse tool calls
    const toolCalls: ToolCall[] = [];
    if (message.tool_calls) {
      for (const tc of message.tool_calls) {
        toolCalls.push({
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
          id: tc.id,
        });
      }
    }

    return {
      content: message.content,
      toolCalls,
      rawResponse: response,
    };
  }

  private convertMessages(messages: Message[]): any[] {
    return messages.map(msg => {
      const converted: any = {
        role: msg.role,
        content: msg.content,
      };

      if (msg.name) {
        converted.name = msg.name;
      }

      if (msg.tool_calls) {
        converted.tool_calls = msg.tool_calls.map(tc => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        }));
      }

      if (msg.tool_call_id) {
        converted.tool_call_id = msg.tool_call_id;
      }

      return converted;
    });
  }
}