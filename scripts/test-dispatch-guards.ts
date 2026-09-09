/**
 * Unit test for the live-SMS gates. Pure functions only — this never starts a
 * server and never contacts a gateway, so it is safe to run with realistic
 * looking credentials in the fixtures.
 */
import {
  liveSendDecision, secretsMatch, isSameOrigin, approvedRoster, makeLimiters, RateLimiter,
  GuardEnv, GuardRequest, Limiters, GENERIC_BLOCK_MESSAGE,
  LIVE_MAX_PER_WINDOW, AUTH_MAX_PER_WINDOW,
} from '../lib/dispatchGuards';

const SECRET = 'a-long-random-shared-secret-value';
const ROSTER = ['+256700000000'];

const fullEnv: GuardEnv = {
  MAJISENSE_SMS_LIVE: 'true',
  AFRICASTALKING_USERNAME: 'sandbox',
  AFRICASTALKING_API_KEY: 'placeholder-not-a-real-key',
  MAJISENSE_DISPATCH_SECRET: SECRET,
};

const goodReq: GuardRequest = {
  dispatchKey: SECRET,
  origin: 'https://majisense.example',
  host: 'majisense.example',
  clientId: '203.0.113.10',
};

let failures = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const pass = actual === expected;
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}`);
  if (!pass) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function decide(env: GuardEnv, req: GuardRequest, roster = ROSTER, limiters: Limiters = makeLimiters()) {
  return liveSendDecision(env, req, roster, limiters);
}

/** A blocked attempt must never be allowed, and must never leak the gate name. */
function blocks(name: string, env: GuardEnv, req: GuardRequest, roster = ROSTER, expectConfig = false) {
  const d = decide(env, req, roster);
  const pass = !d.allowed && d.publicReason === GENERIC_BLOCK_MESSAGE && d.configuration === expectConfig;
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}`);
  if (d.allowed) console.log('        NOT BLOCKED — a live SMS would have been sent');
  else console.log(`        [${d.configuration ? 'config' : 'caller'}] ${d.reason}`);
}

console.log('— configuration gates (safe to show the operator) —');
blocks('opt-in flag missing', { ...fullEnv, MAJISENSE_SMS_LIVE: undefined }, goodReq, ROSTER, true);
blocks('opt-in flag not exactly "true"', { ...fullEnv, MAJISENSE_SMS_LIVE: '1' }, goodReq, ROSTER, true);
blocks('no provider username', { ...fullEnv, AFRICASTALKING_USERNAME: undefined }, goodReq, ROSTER, true);
blocks('no provider api key', { ...fullEnv, AFRICASTALKING_API_KEY: undefined }, goodReq, ROSTER, true);
blocks('empty approved roster', fullEnv, goodReq, [], true);
blocks('no shared secret configured', { ...fullEnv, MAJISENSE_DISPATCH_SECRET: undefined }, goodReq, ROSTER, true);

console.log('\n— caller gates (details must stay server-side) —');
blocks('missing secret header', fullEnv, { ...goodReq, dispatchKey: null });
blocks('wrong secret header', fullEnv, { ...goodReq, dispatchKey: 'wrong-value-same-len!!!!!!!!!!!!!' });
blocks('cross-origin request', fullEnv, { ...goodReq, origin: 'https://evil.example' });

console.log('\n— the fully authorised path —');
const okDecision = decide(fullEnv, goodReq);
check('all gates pass', okDecision.allowed, true);
check('no reason on success', okDecision.reason, null);

console.log('\n— send rate limiting —');
const sendLimiters = makeLimiters();
for (let i = 1; i <= LIVE_MAX_PER_WINDOW; i++) {
  check(`send ${i} of ${LIVE_MAX_PER_WINDOW} allowed`, decide(fullEnv, goodReq, ROSTER, sendLimiters).allowed, true);
}
check(`send ${LIVE_MAX_PER_WINDOW + 1} blocked`, decide(fullEnv, goodReq, ROSTER, sendLimiters).allowed, false);
check(
  'a different caller is unaffected',
  decide(fullEnv, { ...goodReq, clientId: '198.51.100.7' }, ROSTER, sendLimiters).allowed,
  true,
);

console.log('\n— brute-force resistance: failed auth must consume budget —');
const bruteLimiters = makeLimiters();
const attacker: GuardRequest = { ...goodReq, clientId: '198.51.100.66', dispatchKey: 'guess' };
for (let i = 0; i < AUTH_MAX_PER_WINDOW; i++) decide(fullEnv, attacker, ROSTER, bruteLimiters);
const exhausted = decide(fullEnv, attacker, ROSTER, bruteLimiters);
check('attempt budget is exhausted by wrong guesses', exhausted.allowed, false);
check(
  'budget exhaustion is what blocks, not the secret check',
  exhausted.reason?.startsWith('Too many authorization attempts') ?? false,
  true,
);
check(
  'correct secret from the same IP is now also refused',
  decide(fullEnv, { ...attacker, dispatchKey: SECRET }, ROSTER, bruteLimiters).allowed,
  false,
);
check(
  'an unrelated caller can still authorise',
  decide(fullEnv, { ...goodReq, clientId: '203.0.113.99' }, ROSTER, bruteLimiters).allowed,
  true,
);

console.log('\n— helpers —');
check('secretsMatch equal', secretsMatch('abc123', 'abc123'), true);
check('secretsMatch differing', secretsMatch('abc123', 'abc124'), false);
check('secretsMatch length mismatch', secretsMatch('abc', 'abcd'), false);
check('secretsMatch empty vs secret', secretsMatch('', SECRET), false);
check('isSameOrigin match', isSameOrigin('https://a.example', 'a.example'), true);
check('isSameOrigin mismatch', isSameOrigin('https://b.example', 'a.example'), false);
check('isSameOrigin absent header', isSameOrigin(null, 'a.example'), true);
check('isSameOrigin malformed', isSameOrigin('not a url', 'a.example'), false);
check('roster parsing trims and drops blanks', approvedRoster(' +111 , ,+222 ').join('|'), '+111|+222');
check('roster undefined is empty', approvedRoster(undefined).length, 0);

console.log('\n— limiter window rolls over —');
const rolling = new RateLimiter(1_000, 2);
const t0 = 1_000_000;
check('first allowed', rolling.allow('ip', t0), true);
check('second allowed', rolling.allow('ip', t0 + 100), true);
check('third blocked inside window', rolling.allow('ip', t0 + 200), false);
check('allowed again after window', rolling.allow('ip', t0 + 1_500), true);

console.log(failures ? `\n${failures} check(s) failed.` : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
