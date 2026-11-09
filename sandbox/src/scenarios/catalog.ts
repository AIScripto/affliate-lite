import { SANDBOX_PAYOUT } from '../config';
import { BodyCheck, Scenario } from './types';

/** A click ID that does not exist in the tracker. */
const UNKNOWN_CLICK = '00000000-0000-4000-8000-000000000000';

// ---------- small, readable checks ----------

/** Every listed field must have exactly this value. */
const has =
  (expected: Record<string, unknown>): BodyCheck =>
  (body) => {
    for (const [key, value] of Object.entries(expected)) {
      if (body[key] !== value) return `expected ${key} = ${JSON.stringify(value)}, got ${JSON.stringify(body[key])}`;
    }
    return null;
  };

/** Message text must contain this phrase. */
const says =
  (phrase: string): BodyCheck =>
  (body) =>
    String(body.message ?? '').includes(phrase) ? null : `expected message "${phrase}", got "${String(body.message ?? '')}"`;

/** Remember the conversion ID under a name (and run another check). */
const remember =
  (name: string, then?: BodyCheck): BodyCheck =>
  (body, ctx) => {
    ctx.memo[name] = body.conversionId;
    return then ? then(body, ctx) : null;
  };

/** Conversion ID must equal (or differ from) a remembered one. */
const sameConversionAs =
  (name: string, then?: BodyCheck): BodyCheck =>
  (body, ctx) =>
    body.conversionId === ctx.memo[name]
      ? then
        ? then(body, ctx)
        : null
      : `expected the same conversion as before (${String(ctx.memo[name])}), got ${String(body.conversionId)}`;

const differentConversionFrom =
  (name: string): BodyCheck =>
  (body, ctx) =>
    body.conversionId !== ctx.memo[name] ? null : 'expected a new conversion, got the same one';

const all =
  (...checks: BodyCheck[]): BodyCheck =>
  (body, ctx) => {
    for (const c of checks) {
      const problem = c(body, ctx);
      if (problem) return problem;
    }
    return null;
  };

const created = (status = 'APPROVED') => has({ success: true, status, payout: SANDBOX_PAYOUT.payout });

// ---------- scenarios ----------

export const SCENARIOS: Scenario[] = [
  {
    id: 'basic',
    title: 'Basic approved conversion',
    description: 'Network sends one approved conversion using the link the panel gives out.',
    offer: 'strict',
    publisherPostbacks: 1,
    steps: [
      { kind: 'postback', label: 'Send approved conversion', profile: 'get', input: () => ({ goal: '1' }), expectStatus: 200, check: all(created(), has({ revenue: SANDBOX_PAYOUT.revenue })) },
    ],
  },
  {
    id: 'retry',
    title: 'Network sends the same postback again',
    description: 'A retry must not create a second conversion or a second publisher payment.',
    offer: 'strict',
    publisherPostbacks: 1,
    steps: [
      { kind: 'postback', label: 'First send', profile: 'get', input: () => ({ goal: '1' }), expectStatus: 200, check: remember('first', created()) },
      { kind: 'postback', label: 'Same postback again', profile: 'get', input: () => ({ goal: '1' }), expectStatus: 200, check: sameConversionAs('first', has({ duplicate: true })) },
      { kind: 'postback', label: 'And a third time', profile: 'get', input: () => ({ goal: '1' }), expectStatus: 200, check: sameConversionAs('first', has({ duplicate: true })) },
    ],
  },
  {
    id: 'lifecycle',
    title: 'Pending → approved → chargeback',
    description: 'One conversion changes status. The publisher is paid once, when it is approved.',
    offer: 'strict',
    publisherPostbacks: 1,
    steps: [
      { kind: 'postback', label: 'Pending (status 2)', profile: 'get', input: () => ({ goal: '1', status: '2' }), expectStatus: 200, check: remember('conv', created('UNCHECKED')) },
      { kind: 'postback', label: 'Approved (status 1)', profile: 'get', input: () => ({ goal: '1', status: '1' }), expectStatus: 200, check: sameConversionAs('conv', has({ updated: true, previousStatus: 'UNCHECKED', status: 'APPROVED' })) },
      { kind: 'postback', label: 'Chargeback (word)', profile: 'get', input: () => ({ goal: '1', status: 'chargeback' }), expectStatus: 200, check: sameConversionAs('conv', has({ status: 'DECLINED' })) },
    ],
  },
  {
    id: 'declined-first',
    title: 'Declined conversion',
    description: 'A conversion that arrives already declined is saved, but the publisher is not paid.',
    offer: 'strict',
    publisherPostbacks: 0,
    steps: [
      { kind: 'postback', label: 'Declined (status 3)', profile: 'get', input: () => ({ goal: '1', status: '3' }), expectStatus: 200, check: has({ success: true, status: 'DECLINED' }) },
    ],
  },
  {
    id: 'order-amount',
    title: 'Order number and sale amount',
    description: 'The network sends its order number and amount; both are saved.',
    offer: 'strict',
    publisherPostbacks: 1,
    steps: [
      { kind: 'postback', label: 'Send action_id and sum', profile: 'get', input: () => ({ goal: '1', orderId: 'SBX-ORDER-1001', sum: '49.99' }), expectStatus: 200, check: has({ externalTxId: 'SBX-ORDER-1001', revenue: 49.99, payout: SANDBOX_PAYOUT.payout }) },
    ],
  },
  {
    id: 'post-form',
    title: 'POST form body',
    description: 'Network posts the values as a form instead of a link.',
    offer: 'strict',
    publisherPostbacks: 1,
    steps: [{ kind: 'postback', label: 'POST form', profile: 'post-form', input: () => ({ goal: '1' }), expectStatus: 200, check: created() }],
  },
  {
    id: 'post-json',
    title: 'POST JSON body',
    description: 'Network posts the values as JSON.',
    offer: 'strict',
    publisherPostbacks: 1,
    steps: [{ kind: 'postback', label: 'POST JSON', profile: 'post-json', input: () => ({ goal: '1' }), expectStatus: 200, check: created() }],
  },
  {
    id: 'alias-names',
    title: 'Other parameter names',
    description: 'Network uses click_id, amount and transaction_id instead of our standard names.',
    offer: 'strict',
    publisherPostbacks: 1,
    steps: [
      { kind: 'postback', label: 'click_id / amount / transaction_id', profile: 'alias-names', input: () => ({ goal: '1', sum: '20', orderId: 'SBX-ALIAS-1' }), expectStatus: 200, check: has({ success: true, revenue: 20, externalTxId: 'SBX-ALIAS-1' }) },
    ],
  },
  {
    id: 'upper-case',
    title: 'Capital-letter names and click ID',
    description: 'CLICKID=… with the click ID in capital letters is still matched.',
    offer: 'strict',
    publisherPostbacks: 1,
    steps: [
      { kind: 'postback', label: 'CLICKID in capitals', profile: 'upper-case', input: (ctx) => ({ clickId: ctx.clickId.toUpperCase(), goal: '1' }), expectStatus: 200, check: created() },
    ],
  },
  {
    id: 'second-goal-strict',
    title: 'Second goal, network allows one conversion',
    description: 'A second goal on the same click is refused when the network allows only one conversion per click.',
    offer: 'strict',
    publisherPostbacks: 1,
    steps: [
      { kind: 'postback', label: 'Goal 1', profile: 'get', input: () => ({ goal: '1' }), expectStatus: 200, check: created() },
      { kind: 'postback', label: 'Goal 2 (refused)', profile: 'get', input: () => ({ goal: '2' }), expectStatus: 409, check: says('allows only one per click') },
    ],
  },
  {
    id: 'second-goal-open',
    title: 'Second goal, network allows many',
    description: 'Lead then sale on the same click: two conversions, two publisher postbacks.',
    offer: 'open',
    publisherPostbacks: 2,
    steps: [
      { kind: 'postback', label: 'Goal 1 (lead)', profile: 'get', input: () => ({ goal: '1' }), expectStatus: 200, check: remember('lead', created()) },
      { kind: 'postback', label: 'Goal 2 (sale)', profile: 'get', input: () => ({ goal: '2' }), expectStatus: 200, check: all(has({ success: true, goal: '2' }), differentConversionFrom('lead')) },
    ],
  },
  {
    id: 'token',
    title: 'Security token',
    description: 'Offer with a token: missing or wrong token is refused, the right one is accepted.',
    offer: 'token',
    publisherPostbacks: 1,
    steps: [
      { kind: 'postback', label: 'No token', profile: 'get', input: () => ({ goal: '1' }), expectStatus: 403, check: says('security token') },
      { kind: 'postback', label: 'Wrong token', profile: 'get', input: () => ({ goal: '1', token: 'WRONG' }), expectStatus: 403 },
      { kind: 'postback', label: 'Right token (secure_token=)', profile: 'get', input: (ctx) => ({ goal: '1', token: ctx.token }), expectStatus: 200, check: created() },
    ],
  },
  {
    id: 'token-header',
    title: 'Security token in a header',
    description: 'Some networks send the token in a header instead of the link.',
    offer: 'token',
    publisherPostbacks: 1,
    steps: [
      { kind: 'postback', label: 'Token in X-Advertiser-Token', profile: 'header-token', input: (ctx) => ({ goal: '1', token: ctx.token }), expectStatus: 200, check: created() },
    ],
  },
  {
    id: 'bad-input',
    title: 'Wrong values are refused',
    description: 'Broken postbacks get a clear answer and record nothing.',
    offer: 'strict',
    publisherPostbacks: 1,
    steps: [
      { kind: 'postback', label: 'Macro not replaced ({clickid})', profile: 'get', input: () => ({ clickId: '{clickid}' }), expectStatus: 400, check: says('Invalid clickid format') },
      { kind: 'postback', label: 'Unknown click ID', profile: 'get', input: () => ({ clickId: UNKNOWN_CLICK }), expectStatus: 404 },
      { kind: 'postback', label: 'Negative amount', profile: 'get', input: () => ({ sum: '-5' }), expectStatus: 400, check: says('positive number') },
      { kind: 'postback', label: 'Amount is text', profile: 'get', input: () => ({ sum: 'abc' }), expectStatus: 400 },
      { kind: 'postback', label: 'Unknown status', profile: 'get', input: () => ({ status: 'maybe' }), expectStatus: 400, check: says('Unknown status') },
      { kind: 'postback', label: 'Then a valid one is new (nothing was saved before)', profile: 'get', input: () => ({ goal: '1' }), expectStatus: 200, check: all(created(), (b) => (b.duplicate ? 'a wrong postback above was saved' : null)) },
    ],
  },
  {
    id: 'burst',
    title: '10 identical postbacks at once',
    description: 'Parallel retries create exactly one conversion and one publisher payment.',
    offer: 'strict',
    publisherPostbacks: 1,
    steps: [{ kind: 'burst', label: '10 at the same moment', profile: 'get', count: 10, input: () => ({ goal: '1' }) }],
  },
  {
    id: 'pixel-image',
    title: 'Image pixel',
    description: 'Advertiser thank-you page loads the <img> pixel.',
    offer: 'strict',
    publisherPostbacks: 1,
    steps: [
      { kind: 'postback', label: 'Load pixel.jpg', profile: 'pixel-image', input: () => ({ goal: '1' }), expectStatus: 200 },
      { kind: 'postback', label: 'Pixel created it (server postback is a duplicate)', profile: 'get', input: () => ({ goal: '1' }), expectStatus: 200, check: has({ duplicate: true }) },
    ],
  },
  {
    id: 'pixel-script',
    title: 'Script pixel',
    description: 'Advertiser thank-you page loads the <script> pixel.',
    offer: 'strict',
    publisherPostbacks: 1,
    steps: [
      { kind: 'postback', label: 'Load pixel.js', profile: 'pixel-script', input: () => ({ goal: '1' }), expectStatus: 200 },
      { kind: 'postback', label: 'Pixel created it (server postback is a duplicate)', profile: 'get', input: () => ({ goal: '1' }), expectStatus: 200, check: has({ duplicate: true }) },
    ],
  },
];

export function findScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
