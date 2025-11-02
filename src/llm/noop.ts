import { LLM, LLMResponse, Message, FunctionSchema } from '../types';

export class NoopLLM implements LLM {
  private reason: string;
  constructor(reason?: string) {
    this.reason = reason || 'No LLM configured. Provide an LLM or set API keys.';
  }

  async complete(_messages: Message[], _tools?: FunctionSchema[]): Promise<LLMResponse> {
    throw new Error(this.reason);
  }

  async structuredComplete<T = any>(_messages: Message[], _schema: any): Promise<T> {
    throw new Error(this.reason);
  }
}
