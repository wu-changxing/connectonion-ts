/**
 * Anthropic LLM implementation for ConnectOnion TypeScript SDK
 *
 * Notes:
 * - Uses dynamic require to avoid hard dependency if the SDK isn't installed.
 * - Converts OpenAI-style messages and tools into Anthropic format.
 *
 * Anthropic Messages API minimum requirements:
 * - model: API model name to call (e.g., 'claude-3-5-sonnet-20241022')
 * - max_tokens: hard maximum tokens to generate (Claude may stop earlier). This is a hard cap
 *   and may cut off mid‑word/sentence when reached.
 * - messages: an array of input messages (must alternate user/assistant; the first must be 'user').
 *   System prompt is optional and provided as top-level 'system'.
 * Optional common params:
 * - system: system prompt string
 * - temperature: variability in responses (we default to 0 for determinism)
 */

import { LLM, LLMResponse, Message, FunctionSchema, ToolCall } from '../types';

export class AnthropicLLM implements LLM {
  private client: any;
  private model: string;
  private defaultMaxTokens: number;
  private defaultTemperature: number;

  constructor(apiKey?: string, model: string = 'claude-3-5-sonnet-20241022') {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('Anthropic API key required. Set ANTHROPIC_API_KEY or pass apiKey parameter.');
    }

    // Lazy-load anthropic SDK to keep it optional
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Anthropic = require('@anthropic-ai/sdk');
    this.client = new Anthropic({ apiKey: key });
    this.model = model;
    // Parity with Python SDK: Claude requires max_tokens. Use a safe default and allow override.
    this.defaultMaxTokens = 8192;
    // Favor deterministic results by default (can be overridden via params)
    this.defaultTemperature = 0;
  }

  async complete(messages: Message[], tools?: FunctionSchema[]): Promise<LLMResponse> {
    const { system, anthropicMessages } = this.convertMessages(messages);
    const anthropicTools = tools && tools.length > 0 ? this.convertTools(tools) : undefined;

    const params: any = {
      model: this.model,
      // Claude requires max_tokens. Default to 8192 unless caller overrides via extra params.
      max_tokens: this.defaultMaxTokens,
      messages: anthropicMessages,
      temperature: this.defaultTemperature,
    };
    if (system) params.system = system;
    if (anthropicTools) params.tools = anthropicTools;

    const response = await this.client.messages.create(params);

    const toolCalls: ToolCall[] = [];
    let content = '';
    if (response && response.content) {
      for (const block of response.content) {
        if (block.type === 'text') content += block.text;
        if (block.type === 'tool_use') {
          toolCalls.push({ name: block.name, arguments: block.input, id: block.id });
        }
      }
    }

    return {
      content: content || null,
      toolCalls,
      rawResponse: response,
    };
  }

  private convertMessages(messages: Message[]): { system?: string; anthropicMessages: any[] } {
    let system: string | undefined;
    const anthropicMessages: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Anthropic supports system as top-level field
        system = (system ? system + '\n' : '') + (msg.content || '');
        continue;
      }

      if (msg.role === 'tool') {
        // Tool results are appended as user message with tool_result type
        anthropicMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.tool_call_id,
              content: msg.content,
            },
          ],
        });
        continue;
      }

      if (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) {
        const contentBlocks: any[] = [];
        if (msg.content) contentBlocks.push({ type: 'text', text: msg.content });
        for (const tc of msg.tool_calls) {
          contentBlocks.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input: tc.arguments,
          });
        }
        anthropicMessages.push({ role: 'assistant', content: contentBlocks });
        continue;
      }

      // Regular user/assistant text messages (ensure alternation in caller usage; Anthropic expects first to be 'user')
      anthropicMessages.push({ role: msg.role, content: msg.content });
    }

    return { system, anthropicMessages };
  }

  private convertTools(tools: FunctionSchema[]): any[] {
    return tools.map((t) => ({
      name: t.name,
      description: t.description || '',
      input_schema: t.parameters || { type: 'object', properties: {}, required: [] },
    }));
  }

  async structuredComplete<T = any>(messages: Message[], schema: any): Promise<T> {
    const { system, anthropicMessages } = this.convertMessages(messages);
    const tool = {
      name: 'return_structured_output',
      description: 'Return structured JSON matching the requested schema',
      input_schema: schema || { type: 'object', properties: {}, required: [] },
    };
    const params: any = {
      model: this.model,
      // Enforce required params per Anthropic: model, max_tokens, messages
      max_tokens: this.defaultMaxTokens,
      messages: anthropicMessages,
      tools: [tool],
      tool_choice: { type: 'tool', name: 'return_structured_output' },
      temperature: this.defaultTemperature,
    };
    if (system) params.system = system;

    const response = await this.client.messages.create(params);
    for (const block of response.content || []) {
      if (block.type === 'tool_use' && block.name === 'return_structured_output') {
        return block.input as T;
      }
    }
    throw new Error('No structured output received from Anthropic');
  }
}
