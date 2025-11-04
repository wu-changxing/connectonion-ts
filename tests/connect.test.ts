/**
 * Tests for connect() RemoteAgent proxy
 */

import { connect } from '../src/connect';

// Simple mock WebSocket implementation
class MockWebSocket {
  public onopen: ((ev?: any) => any) | null = null;
  public onmessage: ((ev: { data: any }) => any) | null = null;
  public onerror: ((ev: any) => any) | null = null;
  public onclose: ((ev: any) => any) | null = null;
  private closed = false;

  constructor(_url: string) {
    // async open
    setTimeout(() => this.onopen && this.onopen({}), 0);
  }

  send(data: any): void {
    // Echo back as OUTPUT with same input_id
    try {
      const msg = JSON.parse(String(data));
      const out = {
        type: 'OUTPUT',
        input_id: msg.input_id,
        result: `Echo: ${msg.prompt}`,
      };
      setTimeout(() => this.onmessage && this.onmessage({ data: JSON.stringify(out) }), 0);
    } catch (e) {
      setTimeout(() => this.onerror && this.onerror(e), 0);
    }
  }

  close(): void {
    if (!this.closed) {
      this.closed = true;
      this.onclose && this.onclose({});
    }
  }
}

describe('connect()', () => {
  it('returns a RemoteAgent that can input() and receive OUTPUT', async () => {
    const ra = connect('0xabc123', 'ws://localhost:8000/ws/announce', MockWebSocket as any);
    const result = await ra.input('ping');
    expect(result).toBe('Echo: ping');
  });

  it('rejects on agent ERROR response', async () => {
    class ErrorWS extends MockWebSocket {
      send(data: any): void {
        const msg = JSON.parse(String(data));
        const out = { type: 'ERROR', input_id: msg.input_id, error: 'not found' };
        setTimeout(() => this.onmessage && this.onmessage({ data: JSON.stringify(out) }), 0);
      }
    }
    const ra = connect('0xdeadbeef', 'ws://localhost:8000/ws/announce', ErrorWS as any);
    await expect(ra.input('hello')).rejects.toThrow(/not found/);
  });

  it('times out if no response', async () => {
    class NoReplyWS extends MockWebSocket {
      send(_data: any): void {
        // never replies
      }
    }
    const ra = connect('0xabc', 'ws://localhost:8000/ws/announce', NoReplyWS as any);
    await expect(ra.input('hello', 50)).rejects.toThrow(/timed out/);
  });
});
