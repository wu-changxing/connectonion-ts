/**
 * Trust system hooks to mirror Python SDK behavior at a high level.
 * Levels: open | careful | strict
 */

export type TrustLevel = 'open' | 'careful' | 'strict';

const TRUST_PROMPTS: Record<TrustLevel, string> = {
  open: `You are an open trust agent for development environments.
You trust agents to enable rapid iteration and testing.
Use best effort checks but prioritize developer velocity.`,
  careful: `You are a careful trust agent for staging/testing.
Verify agent identity and intent before approval:
1) Require clear purpose, 2) Sanity-check tools, 3) Review consent.
Reject risky actions without context.`,
  strict: `You are a strict trust agent for production.
Only approve actions for pre-approved agents and tools.
Enforce least privilege and strong provenance.`
};

export function getDefaultTrustLevel(): TrustLevel {
  const env = (process.env.CONNECTONION_TRUST || '').toLowerCase();
  if (env === 'open' || env === 'careful' || env === 'strict') return env as TrustLevel;
  return 'careful';
}

export function getTrustPrompt(level: TrustLevel): string {
  return TRUST_PROMPTS[level];
}

/**
 * Create a trust agent or configuration object.
 * For now, return a lightweight object with level and prompt.
 * Future: could return an Agent instance for policy evaluation.
 */
export function createTrustAgent(
  trust?: TrustLevel | { level: TrustLevel; prompt?: string },
  _apiKey?: string,
  _model?: string
) {
  if (!trust) trust = getDefaultTrustLevel();
  const level = typeof trust === 'string' ? trust : trust.level;
  const prompt = typeof trust === 'string' ? getTrustPrompt(trust) : trust.prompt || getTrustPrompt(trust.level);
  return { level, prompt, name: `trust_agent_${level}` };
}

