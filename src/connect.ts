/**
 * Connect to remote agents via the relay network.
 *
 * Mirrors Python SDK connect(): returns a RemoteAgent proxy with input().
 */

import crypto from 'crypto';

// Minimal WebSocket-like interface to support both 'ws' and browser WebSocket
type WebSocketLike = {
  onopen: ((ev?: any) => any) | null;
  onmessage: ((ev: { data: any }) => any) | null;
  onerror: ((ev: any) => any) | null;
  onclose: ((ev: any) => any) | null;
  send(data: any): void;
  close(): void;
};

type WebSocketCtor = new (url: string) => WebSocketLike;

function defaultWebSocketCtor(): WebSocketCtor {
  // Prefer global WebSocket (browser), else require('ws') in Node
  const g: any = globalThis as any;
  if (typeof g.WebSocket === 'function') {
    return g.WebSocket as any;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const WS = require('ws');
    return WS as WebSocketCtor;
  } catch {
    throw new Error(
      "No WebSocket implementation found. Install 'ws' (npm i ws) or provide a custom WebSocket factory."
    );
  }
}

/** Proxy to a remote agent reachable via the relay */
export class RemoteAgent {
  private address: string;
  private relayUrl: string;
  private WS: WebSocketCtor;

  constructor(address: string, relayUrl: string, wsCtor?: WebSocketCtor) {
    this.address = address;
    this.relayUrl = relayUrl;
    this.WS = wsCtor || defaultWebSocketCtor();
  }

  /** Send task to remote agent and await result */
  async input(prompt: string, timeoutMs = 30000): Promise<string> {
    const inputId = crypto.randomUUID();
    const relayInputUrl = this.relayUrl.replace('/ws/announce', '/ws/input');

    const ws = new this.WS(relayInputUrl);

    return await new Promise<string>((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          try { ws.close(); } catch {}
          reject(new Error('Connection timed out'));
        }
      }, timeoutMs);

      ws.onopen = () => {
        // Send INPUT message
        const msg = {
          type: 'INPUT',
          input_id: inputId,
          to: this.address,
          prompt,
        };
        try {
          ws.send(JSON.stringify(msg));
        } catch (e) {
          clearTimeout(timer);
          if (!settled) {
            settled = true;
            try { ws.close(); } catch {}
            reject(e);
          }
        }
      };

      ws.onmessage = (evt: { data: any }) => {
        if (settled) return;
        try {
          const raw = typeof evt.data === 'string' ? evt.data : evt.data?.toString?.() ?? '';
          const data = JSON.parse(raw);
          if (data?.type === 'OUTPUT' && data?.input_id === inputId) {
            settled = true;
            clearTimeout(timer);
            try { ws.close(); } catch {}
            resolve(data?.result ?? '');
          } else if (data?.type === 'ERROR') {
            settled = true;
            clearTimeout(timer);
            try { ws.close(); } catch {}
            reject(new Error(String(data?.error || 'Agent error')));
          } else {
            // Ignore unrelated message; keep waiting
          }
        } catch (e) {
          settled = true;
          clearTimeout(timer);
          try { ws.close(); } catch {}
          reject(e);
        }
      };

      ws.onerror = (err: any) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { ws.close(); } catch {}
        reject(new Error(`WebSocket error: ${String(err?.message || err)}`));
      };

      ws.onclose = () => {
        // If closed without settling, treat as error
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(new Error('Connection closed before response'));
        }
      };
    });
  }

  toString() {
    const short = this.address.length > 12 ? this.address.slice(0, 12) + '...' : this.address;
    return `RemoteAgent(${short})`;
  }
}

/**
 * Connect to a remote agent.
 *
 * @param address Agent public key (0x...)
 * @param relayUrl Relay announce URL (default production)
 */
export function connect(
  address: string,
  relayUrl: string = process.env.RELAY_URL || 'wss://oo.openonion.ai/ws/announce',
  wsCtor?: WebSocketCtor
): RemoteAgent {
  return new RemoteAgent(address, relayUrl, wsCtor);
}
