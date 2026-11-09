import { page } from './layout';

/** Sandbox home screen. Data is loaded from /api/* by the script below. */
export function dashboardPage(): string {
  const body = `
  <header style="display:grid;gap:6px">
    <span class="eyebrow">Test only · never connect to production</span>
    <h1>Affiliate Sandbox</h1>
    <p class="muted">A fake network and a fake publisher. They use the tracker exactly like real partners do: tracking link, redirect, postback, publisher postback.</p>
  </header>

  <section class="panel">
    <div class="row" style="justify-content:space-between"><h2>Setup</h2>
      <div class="row">
        <button class="btn" id="setup">Create / refresh test records</button>
        <button class="btn danger" id="cleanup" title="Deletes the sandbox offers with all their clicks and conversions">Delete test data</button>
      </div>
    </div>
    <dl class="kv" id="status"><dt>Loading…</dt><dd></dd></dl>
    <p class="muted" id="setup-msg"></p>
  </section>

  <section class="panel">
    <h2>Postback link for sources</h2>
    <p class="muted">What a real network or advertiser gets. They replace each {…} with their own macro.</p>
    <code id="pb-basic"></code>
    <code id="pb-full"></code>
  </section>

  <section class="panel">
    <div class="row" style="justify-content:space-between">
      <h2>Automatic tests</h2>
      <div class="row"><span class="muted" id="summary"></span><button class="btn primary" id="run-all">Run all tests</button></div>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Test</th><th>What it checks</th><th>Result</th><th></th></tr></thead>
      <tbody id="scenarios"></tbody>
    </table></div>
  </section>

  <section class="panel">
    <h2>Manual test</h2>
    <p class="muted">Open a tracking link like a visitor. You land on the fake advertiser page and choose what it reports back.</p>
    <div class="row" id="manual-links"></div>
  </section>

  <section class="panel">
    <div class="row" style="justify-content:space-between"><h2>Recent activity</h2><button class="btn" id="clear-events">Clear list</button></div>
    <div class="table-wrap"><table><thead><tr><th>Time</th><th>Event</th><th>Details</th></tr></thead><tbody id="events"></tbody></table></div>
  </section>`;

  return page('Affiliate Sandbox', body, SCRIPT);
}

const SCRIPT = `
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const LABEL = { pass: 'Passed', fail: 'Failed', skipped: 'Skipped', 'not-run': 'Not run' };
const results = {};
let scenarios = [];

async function api(path, options) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || ('HTTP ' + res.status));
  return data;
}

function renderStatus(s) {
  const f = s.fixtures;
  $('status').innerHTML =
    '<dt>Tracker</dt><dd><code>' + esc(s.trackerUrl) + '</code></dd>' +
    '<dt>Sandbox address</dt><dd><code>' + esc(s.publicUrl) + '</code></dd>' +
    '<dt>Publisher check</dt><dd>' + (s.publisherCheck ? '<span class="pill pass">On</span>' : '<span class="pill skipped">Off: sandbox address is local</span>') + '</dd>' +
    '<dt>Test records</dt><dd>' + (f ? 'Publisher #' + f.publisherId + ' · offers #' + f.offers.strict + ', #' + f.offers.open + ', #' + f.offers.token : 'Not created yet. Press "Create / refresh test records".') + '</dd>';
  $('pb-basic').textContent = s.postbackUrls.basic;
  $('pb-full').textContent = s.postbackUrls.full;
  $('manual-links').innerHTML = f
    ? s.manualLinks.map((l) => '<a class="btn" target="_blank" rel="noopener" href="' + esc(l.url) + '">' + esc(l.label) + '</a>').join('')
    : '<span class="muted">Create the test records first.</span>';
}

function renderScenarios() {
  const rows = scenarios.map((s) => {
    const r = results[s.id];
    const pill = r ? '<span class="pill ' + (r.passed ? 'pass' : 'fail') + '">' + (r.passed ? 'Passed' : 'Failed') + '</span> <span class="muted mono">' + r.durationMs + ' ms</span>' : '<span class="muted">Not run</span>';
    let html = '<tr><td><b>' + esc(s.title) + '</b></td><td class="muted">' + esc(s.description) + '</td><td>' + pill + '</td>' +
      '<td><button class="btn" data-run="' + esc(s.id) + '">Run</button></td></tr>';
    if (r) {
      html += '<tr><td colspan="4" style="background:var(--bg)"><div class="table-wrap"><table>' +
        (r.clickId ? '<tr><td colspan="3" class="muted">Click <span class="mono">' + esc(r.clickId) + '</span></td></tr>' : '') +
        r.steps.map((st) => '<tr><td style="width:120px"><span class="pill ' + st.outcome + '">' + LABEL[st.outcome] + '</span></td><td>' + esc(st.label) +
          (st.request ? '<br><code>' + esc(st.request.method + ' ' + st.request.url) + '</code>' : '') + '</td><td class="muted">' + esc(st.detail) + '</td></tr>').join('') +
        '</table></div></td></tr>';
    }
    return html;
  });
  $('scenarios').innerHTML = rows.join('');
  const done = scenarios.filter((s) => results[s.id]);
  const passed = done.filter((s) => results[s.id].passed).length;
  $('summary').textContent = done.length ? passed + ' of ' + done.length + ' passed' : '';
}

async function loadEvents() {
  try { const r = await fetch('/network/events'); if (r.ok) $('events').innerHTML = await r.text(); } catch (e) {}
}

async function loadStatus() {
  const s = await api('/api/status');
  scenarios = s.scenarios;
  renderStatus(s);
  renderScenarios();
}

async function run(id, button) {
  const buttons = document.querySelectorAll('[data-run], #run-all');
  buttons.forEach((b) => (b.disabled = true));
  const old = button.textContent;
  button.textContent = 'Running…';
  try {
    const data = await api('/api/run', { method: 'POST', body: JSON.stringify({ id }) });
    data.results.forEach((r) => (results[r.id] = r));
    await loadStatus();
  } catch (e) {
    $('setup-msg').textContent = 'Run failed: ' + e.message;
  } finally {
    button.textContent = old;
    document.querySelectorAll('[data-run], #run-all').forEach((b) => (b.disabled = false));
    loadEvents();
  }
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-run]');
  if (b) run(b.dataset.run, b);
});
$('run-all').onclick = (e) => run('all', e.currentTarget);
$('setup').onclick = async () => {
  $('setup-msg').textContent = 'Creating…';
  try { await api('/api/setup', { method: 'POST' }); $('setup-msg').textContent = 'Test records are ready.'; await loadStatus(); }
  catch (e) { $('setup-msg').textContent = 'Setup failed: ' + e.message; }
};
$('cleanup').onclick = async (e) => {
  const b = e.currentTarget;
  if (b.dataset.confirm !== 'yes') { b.dataset.confirm = 'yes'; b.textContent = 'Click again to delete'; setTimeout(() => { b.dataset.confirm = ''; b.textContent = 'Delete test data'; }, 4000); return; }
  b.dataset.confirm = '';
  b.textContent = 'Delete test data';
  try { const r = await api('/api/cleanup', { method: 'POST' }); $('setup-msg').textContent = 'Deleted: ' + (r.deletedOffers.join(', ') || 'nothing to delete'); await loadStatus(); }
  catch (err) { $('setup-msg').textContent = 'Delete failed: ' + err.message; }
};
$('clear-events').onclick = async () => { await api('/api/events/clear', { method: 'POST' }); loadEvents(); };

loadStatus().catch((e) => ($('setup-msg').textContent = 'Could not load status: ' + e.message));
loadEvents();
setInterval(loadEvents, 4000);
`;
