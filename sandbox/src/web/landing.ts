import { ProfileId, PostbackInput } from '../tracker/profiles';
import { SandboxEvent } from '../store';
import { esc, page } from './layout';

/** Buttons on the fake advertiser page: what each one sends to the tracker. */
export const LANDING_ACTIONS: Record<string, { label: string; hint: string; profile: ProfileId; input: Partial<PostbackInput> }> = {
  approve: { label: 'Approve', hint: 'status 1, goal 1', profile: 'get', input: { goal: '1', status: '1' } },
  pending: { label: 'Pending', hint: 'status 2: approve or decline later', profile: 'get', input: { goal: '1', status: '2' } },
  chargeback: { label: 'Chargeback', hint: 'status "chargeback" after approval', profile: 'get', input: { goal: '1', status: 'chargeback' } },
  'second-goal': { label: 'Second goal', hint: 'goal 2 on the same click', profile: 'get', input: { goal: '2', status: '1' } },
  'with-order': { label: 'Sale with order and amount', hint: 'action_id + sum=49.99', profile: 'get', input: { goal: '1', status: '1', orderId: 'SBX-MANUAL', sum: '49.99' } },
  pixel: { label: 'Fire image pixel', hint: 'like a thank-you page', profile: 'pixel-image', input: { goal: '1' } },
};

const EVENT_LABEL: Record<SandboxEvent['type'], string> = {
  landing: 'Visitor arrived',
  'postback-sent': 'Postback to tracker',
  'publisher-received': 'Publisher postback received',
};

export function eventRows(events: SandboxEvent[]): string {
  if (events.length === 0) return '<tr><td colspan="3" class="muted">Nothing yet.</td></tr>';
  return events
    .map(
      (e) => `<tr><td class="mono">${esc(e.at.slice(11, 19))}</td><td>${esc(EVENT_LABEL[e.type])}</td>
      <td><div>${esc(e.summary)}</div>${e.data.url ? `<code>${esc(e.data.url)}</code>` : ''}</td></tr>`
    )
    .join('');
}

export function landingPage(params: { clickId: string; offerId: string; subId: string; events: SandboxEvent[]; error?: string }): string {
  const { clickId, offerId, subId, events, error } = params;
  const buttons = Object.entries(LANDING_ACTIONS)
    .map(
      ([id, a]) => `<button class="btn${id === 'approve' ? ' primary' : ''}" name="action" value="${esc(id)}" title="${esc(a.hint)}">${esc(a.label)}</button>`
    )
    .join('');

  const body = `
  <header style="display:grid;gap:6px">
    <span class="eyebrow">Sandbox · fake advertiser page</span>
    <h1>Thank you for your visit</h1>
    <p class="muted">The tracker sent this visitor here after the click. Choose what the advertiser reports back.</p>
  </header>
  ${error ? `<div class="panel" style="border-color:var(--bad)"><b class="fail pill">Error</b> ${esc(error)}</div>` : ''}
  <section class="panel">
    <dl class="kv">
      <dt>Click ID</dt><dd class="mono">${esc(clickId || '— missing: the offer destination URL has no {clickid}')}</dd>
      <dt>Offer</dt><dd>${esc(offerId || '—')}</dd>
      <dt>Sub ID</dt><dd>${esc(subId || '—')}</dd>
    </dl>
    <form method="post" action="/network/convert" class="row">
      <input type="hidden" name="clickid" value="${esc(clickId)}">
      <input type="hidden" name="offer_id" value="${esc(offerId)}">
      ${buttons}
    </form>
  </section>
  <section class="panel">
    <div class="row" style="justify-content:space-between"><h2>What happened</h2><a class="btn" href="/">Back to sandbox</a></div>
    <div class="table-wrap"><table><thead><tr><th>Time</th><th>Event</th><th>Details</th></tr></thead>
    <tbody id="events">${eventRows(events)}</tbody></table></div>
    <p class="muted">Publisher postbacks arrive a moment after an approval; this list refreshes by itself.</p>
  </section>`;

  const script = clickId
    ? `setInterval(async () => {
         try { const r = await fetch('/network/events?clickid=${encodeURIComponent(clickId)}'); if (r.ok) document.getElementById('events').innerHTML = await r.text(); } catch (e) {}
       }, 2000);`
    : '';
  return page('Sandbox advertiser page', body, script);
}
