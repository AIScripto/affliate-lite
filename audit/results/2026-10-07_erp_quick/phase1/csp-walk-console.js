// Read-only walk of the signed-in app. Paste into the browser console (F12) on the dashboard. It only opens screens
// (sidebar, report tabs, Setup tabs); it does not type, save, approve or delete anything.
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const SETUP = ['grades', 'departments', 'employees', 'roles', 'users', 'access', 'periods', 'assessment-options', 'skill-framework',
    'dept-skill-map', 'competency-targets', 'cefr-config', 'behavioral-config', 'skill-map', 'cefr-specs', 'industries-domains'];
  const problems = {};
  let current = 'start';
  const note = (text) => { (problems[current] ||= []).push(text); };
  document.addEventListener('securitypolicyviolation', (e) => note(`CSP: ${e.effectiveDirective} blocked ${e.blockedURI || 'inline'}`));
  window.addEventListener('error', (e) => note(`JS error: ${String(e.message).slice(0, 100)}`));
  const results = [];
  const textLength = () => (document.querySelector('main')?.innerText || document.body.innerText).trim().length;
  const step = async (name, action) => {
    current = name;
    console.log(`%c=== ${name} ===`, 'color:#0a0;font-weight:bold'); // red errors printed after this line belong to this screen
    try { await action(); } catch (e) { note(`could not open: ${e.message}`); }
    await sleep(1800);
    results.push({ screen: name, contentChars: textLength(), problems: problems[name] ? problems[name].join(' | ') : 'none' });
  };
  const press = (label) => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().toLowerCase() === label.toLowerCase());
    if (!b) throw new Error(`no button "${label}"`);
    b.click();
  };
  for (const label of ['Admin Dashboard', 'Pending Approvals', 'Team Roster', 'Skill Assessments', 'CEFR Communication', 'AI Dashboard']) {
    await step(`tab: ${label}`, async () => press(label));
  }
  // Open Reports only if it is closed: pressing it again would close it.
  await step('Reports', async () => { if (!document.querySelector('[data-testid="report-nav-tree"]')) press('Reports'); });
  const groups = [...document.querySelectorAll('[data-testid="report-nav-tree"] [data-report-group]')].map((e) => e.dataset.reportGroup);
  for (const group of groups) {
    await step(`report group: ${group}`, async () => document.querySelector(`[data-report-group="${group}"]`).click());
    const ids = [...document.querySelectorAll('[data-testid="report-tabs"] [data-report-tab]')].map((e) => e.dataset.reportTab);
    for (const id of ids) await step(`report: ${id}`, async () => document.querySelector(`[data-report-tab="${id}"]`).click());
  }
  await step('Setup', async () => press('Setup'));
  for (const id of SETUP) await step(`setup: ${id}`, async () => { window.location.hash = id; });
  console.log('%cDONE. Summary below. contentChars near 0 means an empty screen.', 'color:#06c;font-weight:bold');
  console.table(results);
  return results;
})();
