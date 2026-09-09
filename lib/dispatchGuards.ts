/**
 * Gates that must all pass before /api/dispatch sends a real SMS.
 *
 * Kept out of the route handler so the logic can be unit tested directly,
 * without standing up a server that holds live gateway credentials.
 *
 * Sending real SMS costs money and reaches real phones, so credentials alone
 * are deliberately not sufficient. A caller must also clear an explicit opt-in
 * flag, a shared secret, a same-origin check and a rate limit.
 */

export interface GuardEnv {
  MAJISENSE_SMS_LIVE?: string;
  AFRICASTALKING_USERNAME?: string;
  AFRICASTALKING_API_KEY?: string;
  MAJISENSE_DISPATCH_SECRET?: string;
}

export interface GuardRequest {
  /** Value of the x-majisense-dispatch-key header, if any. */
  dispatchKey: string | null;
  /** Value of the Origin header, if any. */
  origin: string | null;
  /** Value of the Host header, if any. */
  host: string | null;
  /** Caller identity used for rate limiting, normally the client IP. */
  clientId: string;
}

/** Largest values a single request may claim, bounding response size. */
export const MAX_RECIPIENTS_PER_LEG = 100_000;
export const MAX_BODY_CHARS = 2_000;
export const MAX_CHANNELS = 10;
export const MAX_AUDIENCES = 20;

/** Budget for successful live sends. */
export const LIVE_WINDOW_MS = 60_000;
export const LIVE_MAX_PER_WINDOW = 3;

/**
 * Budget for *authorization attempts* once live mode is armed. This is spent
 * before the secret is compared, so a caller cannot brute-force the secret by
 * making requests that never reach the send limiter.
 */
export const AUTH_WINDOW_MS = 5 * 60_000;
export const AUTH_MAX_PER_WINDOW = 10;

/** Returned to clients in place of the specific gate that failed. */
export const GENERIC_BLOCK_MESSAGE = 'live send not authorized';

/**
 * Fixed-window limiter for live sends only. In-memory, so it resets on
 * redeploy and does not span instances — adequate for a prototype, not a
 * substitute for a quota on the gateway account itself.
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private windowMs = LIVE_WINDOW_MS,
    private max = LIVE_MAX_PER_WINDOW,
  ) {}

  allow(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter(t => now - t < this.windowMs);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  reset() {
    this.hits.clear();
  }
}

/** Constant-time compare so the secret can't be recovered byte by byte. */
export function secretsMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Cross-site POSTs carry an Origin that isn't ours; same-origin ones may omit it. */
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export interface Limiters {
  /** Spent on every authorization attempt once live mode is armed. */
  attempts: RateLimiter;
  /** Spent only once a request is fully authorized. */
  sends: RateLimiter;
}

export interface GuardDecision {
  allowed: boolean;
  /**
   * Specific gate that failed. Server-side logging and operator diagnostics
   * only — returning this to a caller would confirm that live mode is armed
   * and tell an attacker exactly what to bypass.
   */
  reason: string | null;
  /** Safe to show a client. Identical for every failure. */
  publicReason: string | null;
  /**
   * True when the failure is a deployment configuration gap rather than a
   * rejected caller, so the route can surface it to whoever is wiring up the
   * gateway without leaking anything to an unauthorized caller.
   */
  configuration: boolean;
}

function refuse(reason: string, configuration = false): GuardDecision {
  return { allowed: false, reason, publicReason: GENERIC_BLOCK_MESSAGE, configuration };
}

/**
 * Decides whether a request may trigger a real SMS.
 *
 * Configuration gates run first: if live mode is not armed there is nothing to
 * attack, so those failures are marked `configuration` and are safe to show the
 * operator. Once armed, every attempt spends the attempt budget *before* the
 * secret is compared, which is what makes brute-forcing the secret impractical.
 *
 * Callers fall back to simulation rather than erroring, so a demo never breaks.
 */
export function liveSendDecision(
  env: GuardEnv,
  req: GuardRequest,
  approvedRecipients: string[],
  limiters: Limiters,
): GuardDecision {
  // ── Configuration gates — nothing is armed yet ──
  if (env.MAJISENSE_SMS_LIVE !== 'true') {
    return refuse('Live sending is off. Set MAJISENSE_SMS_LIVE=true to enable it.', true);
  }
  if (!env.AFRICASTALKING_USERNAME || !env.AFRICASTALKING_API_KEY) {
    return refuse('Provider credentials are not configured.', true);
  }
  if (!approvedRecipients.length) {
    return refuse('MAJISENSE_SMS_RECIPIENTS is empty, so there is no approved roster to send to.', true);
  }
  if (!env.MAJISENSE_DISPATCH_SECRET) {
    return refuse('MAJISENSE_DISPATCH_SECRET is not set. Live sending requires a shared secret.', true);
  }

  // ── Caller gates — live mode is armed, so treat every attempt as hostile ──
  if (!limiters.attempts.allow(req.clientId)) {
    return refuse(`Too many authorization attempts (${AUTH_MAX_PER_WINDOW} per 5 minutes).`);
  }
  if (!secretsMatch(req.dispatchKey ?? '', env.MAJISENSE_DISPATCH_SECRET)) {
    return refuse('Missing or invalid x-majisense-dispatch-key header.');
  }
  if (!isSameOrigin(req.origin, req.host)) {
    return refuse('Cross-origin request refused for live sending.');
  }
  if (!limiters.sends.allow(req.clientId)) {
    return refuse(`Rate limit reached (${LIVE_MAX_PER_WINDOW} live sends per minute).`);
  }

  return { allowed: true, reason: null, publicReason: null, configuration: false };
}

export function makeLimiters(): Limiters {
  return {
    attempts: new RateLimiter(AUTH_WINDOW_MS, AUTH_MAX_PER_WINDOW),
    sends: new RateLimiter(LIVE_WINDOW_MS, LIVE_MAX_PER_WINDOW),
  };
}

/** Parses the approved roster. Live SMS may go nowhere else. */
export function approvedRoster(raw: string | undefined): string[] {
  return (raw ?? '').split(',').map(s => s.trim()).filter(Boolean);
}
