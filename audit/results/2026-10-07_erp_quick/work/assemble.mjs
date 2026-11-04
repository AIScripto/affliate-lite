// Merge reviewer drafts (A, B, C) + tool-scan findings into findings.json.
// Stage 4-6 helper for this run only. Reads work/agent-*.json, writes ../findings.json and ../report.config.json.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const RUN = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const WORK = path.join(RUN, 'work');
const ROOT = '/Users/tk-lpt-1088/development/react/erp/ERP';
const rd = (f) => JSON.parse(fs.readFileSync(path.join(WORK, f), 'utf8'));
const src = {};
for (const a of ['A', 'B', 'C']) for (const f of rd(`agent-${a}.json`)) src[f.id] = f;
const SEVRANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const EFF = ['S', 'M', 'L'];
const scrub = (s) => (typeof s === 'string' ? s.replace(/password123/gi, 'the shared test password').replace(/\b(1363|1139|2166|1818|2754)\b/g, '<employee code>').replace(/ ?\((?:draft )?[ABC]-\d{2}\)/g, '') : s);

// line numbers for dependency findings
const lineOf = (file, needle) => {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const i = lines.findIndex((l) => l.includes(needle));
  return i < 0 ? 1 : i + 1;
};
const npmV = execSync('npm -v').toString().trim();

// key, sources, dimension, severity (null = take from primary), urgency, reason, wave, blocked_by keys, chain, decision, overrides
const R = [
  ['SEC-hash', ['A-01', 'B-01'], 'security', null, 'U0', 'Credential material is exposed to admin users and through the assignment endpoints; cheap to contain.', 'W0', [], 'CHAIN-1', null, { title: 'Password hashes are sent to the browser by the user, assignment and audit-log endpoints' }],
  ['SEC-auditlog', ['A-02'], 'security', null, 'U0', 'Hashes stay in the log table after the API leak is fixed; the owner must scrub existing rows.', 'W0', [], 'CHAIN-1', null, {}],
  ['SEC-cefr', ['A-03'], 'security', null, 'U0', 'Any manager can change any employee\'s CEFR result today; the fix is one scope check.', 'W0', [], 'CHAIN-2', null, {}],
  ['SEC-demo', ['C-01'], 'security', null, 'U0', 'Test logins for admin-level employee codes ship in the bundle; only the owner can check whether they exist in production.', 'W0', [], null, 'D0', {}],
  ['TST-http', ['C-12'], 'testing', null, 'U1', 'Prerequisite: without HTTP role-by-route tests, the access fixes cannot be proven or protected from regression.', 'W1', [], null, null, {}],
  ['OPS-main', ['C-04'], 'cicd-supply-chain', null, 'U1', 'A stale branch can publish production images; one pipeline edit.', 'W1', [], 'CHAIN-4', null, {}],
  ['OPS-latest', ['C-03'], 'cicd-supply-chain', null, 'U1', 'Production can run an unreviewed image; cheap to pin.', 'W1', [], 'CHAIN-4', null, {}],
  ['OPS-ci', ['C-05'], 'cicd-supply-chain', null, 'U1', 'The pipeline has no dependency or image scan, and its scanners float.', 'W1', [], null, null, {}],
  ['DEP-be', null, 'dependencies', 'Medium', 'U1', 'Cheap upgrade; also a prerequisite for fixing proxy trust (SEC-proxy).', 'W1', [], null, null, {
    title: 'Backend production dependencies have known vulnerabilities (1 critical, 3 high)', repo: 'backend', confidence: 'confirmed', likelihood: 'Low', impact: 'High',
    evidence: 'npm audit --omit=dev reports 8 issues (1 critical, 3 high, 4 moderate). Critical: proxy-addr 2.0.7, IP spoofing via an IPv4-mapped IPv6 trust subnet (fix 2.0.8). High: fast-uri 3.1.5 (SSRF and host confusion, fix 3.1.7), brace-expansion 5.0.9, js-yaml 4.3.1. Moderate: express, body-parser, qs, fast-copy. Rated Medium, not Critical, because Express has no trust proxy setting today (see SEC-proxy), so the proxy-addr flaw is not reachable yet. Trivy agrees (1 critical, 8 high).',
    locations: [`backend/package.json:${lineOf(ROOT + '/backend/package.json', '"express"')}`, 'backend/package-lock.json:1'],
    impact_text: 'Known flaws in packages that run in production, one rated critical by the scanner.', root_cause: 'Dependencies not updated since the lockfile was created; no scan step in the pipeline (see OPS-ci).',
    fix: 'Update to the fixed versions within the allowed ranges (express chain, proxy-addr 2.0.8, fast-uri 3.1.7, js-yaml 4.3.2, brace-expansion), run the full test suite, then re-run npm audit --omit=dev.',
    test: 'npm audit --omit=dev shows no high or critical; full backend suite passes.', effort: 'S', fix_risk: 'medium' }],
  ['DEP-fe', null, 'dependencies', 'Medium', 'U2', 'Several flaws are in the Node side of axios and in build tools, so exposure in browsers is limited.', 'W1', [], null, null, {
    title: 'Frontend production dependencies have known vulnerabilities (7 high, 4 moderate)', repo: 'frontend', confidence: 'confirmed', likelihood: 'Low', impact: 'Medium',
    evidence: 'npm audit --omit=dev reports 11 issues (7 high, 4 moderate, 0 critical). axios 1.19.0 has 7 CVEs (fix 1.20.0; several apply to the Node HTTP adapter, one to a prototype-pollution gadget). react-router-dom has an open-redirect issue (moderate). The tailwindcss chain (braces, micromatch, chokidar, fast-glob, source-map-js) is build-time. Trivy agrees (9 high).',
    locations: [`frontend/package.json:${lineOf(ROOT + '/frontend/package.json', '"axios"')}`, `frontend/package.json:${lineOf(ROOT + '/frontend/package.json', '"react-router-dom"')}`],
    impact_text: 'Known flaws in the HTTP client and router used by every screen.', root_cause: 'Dependencies not updated; no scan step in the pipeline (see OPS-ci).',
    fix: 'Upgrade axios to 1.20.0 or later and react-router-dom to a patched version; plan the Tailwind upgrade separately; re-run the tests and npm audit --omit=dev.',
    test: 'npm audit --omit=dev shows no high on axios and react-router-dom; frontend suite and e2e smoke pass.', effort: 'S', fix_risk: 'medium' }],
  ['SEC-approved-edit', ['A-05'], 'security', null, 'U1', 'Breaks the approval guarantee: an approved score can change with no new approval.', 'W2', ['TST-http'], 'CHAIN-2', null, {}],
  ['SEC-senior', ['A-04'], 'security', 'Medium', 'U2', 'Policy decision needed first; the written rule covers only LINE_MANAGER and MANAGER.', 'W2', ['TST-http'], 'CHAIN-2', 'D1', {
    title: 'ADMIN and TOP_MANAGEMENT can approve their own skills and CEFR results',
    evidence: 'Verified: the self-approval guard only tests for LINE_MANAGER or MANAGER (assessment.controller.ts actsOnOwnRecord, communication.controller.ts isSelfApproval). Rated Medium (downgraded from the reviewer\'s High) because LINE_MANAGER_SELF_ASSESMENT_RULE.md only covers those two roles; who approves senior roles is a business decision (D1).' }],
  ['SEC-peer', ['A-14'], 'security', null, 'U2', 'Needs the scope test from TST-http first.', 'W2', ['TST-http'], null, null, {}],
  ['SEC-logout', ['A-06'], 'security', null, 'U1', 'A stolen refresh token stays valid after the user logs out.', 'W2', [], null, null, {}],
  ['SEC-revoke', ['A-07', 'A-20'], 'security', null, 'U1', 'A password reset does not end existing sessions, which defeats the usual response to a leaked hash.', 'W2', [], 'CHAIN-1', null, {}],
  ['SEC-logs', ['A-08', 'B-10'], 'security', null, 'U2', 'Tokens may land in logs; verify the actual log output first (not observed).', 'W2', [], null, null, {}],
  ['SEC-proxy', ['A-09'], 'security', null, 'U2', 'Login throttling sees only the proxy address.', 'W2', ['DEP-be'], null, null, {}],
  ['SEC-ratelimit', ['A-10', 'C-09'], 'security', null, 'U2', 'An attacker can dodge the API rate limit by changing a header.', 'W2', [], null, null, {}],
  ['SEC-lockout', ['A-11', 'A-12'], 'security', null, 'U2', 'Anyone can lock a known user out, and login reveals which users exist.', 'W2', [], 'CHAIN-1', null, {}],
  ['SEC-behav', ['A-13'], 'security', null, 'U2', 'Behavioral ratings skip the period and approval checks that skills have.', 'W2', ['TST-http'], null, null, {}],
  ['SEC-delete', ['A-15'], 'security', null, 'U2', 'Assessment deletion has no status, period or audit check.', 'W2', ['TST-http'], null, null, {}],
  ['SEC-audittrail', ['A-16', 'B-08'], 'security', null, 'U2', 'User, role and password changes leave no trace.', 'W2', [], 'CHAIN-2', null, {}],
  ['REL-atomic', ['B-02'], 'reliability', null, 'U1', 'A failed recompute is swallowed, so saved assessments can leave scores stale with no signal.', 'W3', [], 'CHAIN-3', null, {}],
  ['REL-concurrent', ['B-04'], 'reliability', null, 'U2', 'Needs the transaction from REL-atomic first.', 'W3', ['REL-atomic'], 'CHAIN-3', null, {}],
  ['PRF-recompute', ['B-03'], 'performance', null, 'U2', 'Cost per save grows with the person\'s competency count.', 'W3', ['REL-atomic'], null, null, {}],
  ['DAT-widths', ['C-15'], 'data', null, 'U2', 'Breaks the no-invented-numbers rule on an executive screen; small fix.', 'W3', [], null, null, {}],
  ['DAT-ready-be', ['B-15'], 'data', null, 'U2', 'A third copy of the overall score and zeros where data is absent.', 'W3', [], null, null, {}],
  ['DAT-ready-fe', ['C-17'], 'data', null, 'U2', 'Several readiness rules in the frontend; needs one rule from the backend.', 'W3', ['DAT-ready-be'], null, 'D4', {}],
  ['DAT-dbid', ['C-16'], 'data', null, 'U3', 'A database number is visible in one picker.', 'W3', [], null, null, {}],
  ['DAT-history', ['B-05'], 'data', null, 'U1', 'Past appraisal results are overwritten; high fix risk, so it follows the tests and the atomic write.', 'W4', ['REL-atomic', 'TST-http'], 'CHAIN-3', 'D6', {}],
  ['DAT-lock', ['B-06'], 'data', null, 'U2', 'A locked period is only locked in application code.', 'W4', ['DAT-history'], null, null, {}],
  ['DAT-version', ['B-07'], 'data', null, 'U2', 'Editing weights or targets silently changes old results.', 'W4', ['DAT-history'], 'CHAIN-3', null, {}],
  ['DAT-cascade', ['B-18'], 'data', null, 'U2', 'Deleting a config row can erase or null history.', 'W4', [], null, null, {}],
  ['DAT-migr', ['B-17'], 'data', null, 'U3', 'Old migrations are not safe to repeat.', 'W4', [], null, null, {}],
  ['OPS-root', ['C-02'], 'cicd-supply-chain', null, 'U2', 'A container escape starts as root; unpinned base and curl-to-bash install.', 'W5', [], null, null, {}],
  ['OPS-registry', ['C-06'], 'cicd-supply-chain', null, 'U2', 'Production images depend on one person\'s account.', 'W5', [], null, 'D2', {}],
  ['SEC-errors', ['B-09'], 'security', null, 'U2', 'Raw database errors reach clients.', 'W5', [], null, null, {}],
  ['SEC-ai', ['B-12', 'B-13'], 'security', null, 'U2', 'Named employee data is sent to OpenAI with no timeout or cost cap.', 'W5', [], null, null, {}],
  ['SEC-port', ['C-07'], 'security', null, 'U2', 'Port 4000 may bypass nginx protections.', 'W5', [], null, null, {}],
  ['SEC-csp', ['C-08'], 'security', null, 'U2', 'No Content-Security-Policy anywhere.', 'W5', [], null, null, {}],
  ['REL-shutdown', ['B-11'], 'reliability', null, 'U3', 'Requests in flight can be cut on deploy.', 'W5', [], null, null, {}],
  ['REL-migrate', ['C-10'], 'reliability', null, 'U2', 'Production migrations run with no backup step or health gate.', 'W5', [], 'CHAIN-4', null, {}],
  ['DAT-backup', ['C-11'], 'data', null, 'U2', 'Backups sit in a world-readable folder with no retention.', 'W5', [], 'CHAIN-4', 'D3', {}],
  ['PRF-reports', ['B-14'], 'performance', null, 'U2', 'Reports compute everything on every read.', 'W5', [], null, null, {}],
  ['DEP-dev', null, 'dependencies', 'Low', 'U3', 'Dev-only tools; no production exposure.', 'W5', [], null, null, {
    title: 'Development tools have known vulnerabilities (jest chain, vitest, tailwind chain)', repo: 'workspace', confidence: 'confirmed', likelihood: 'Low', impact: 'Low',
    evidence: 'npm audit (all dependencies) reports 39 issues in the backend (1 critical, 32 high) and 17 in the frontend (2 critical, 10 high). Counting production dependencies only, the totals drop to 8 and 11, so most of the rest are dev-only: the jest chain (about 30 packages) in the backend, and vitest/tinypool (critical) and vite in the frontend. They run on developer machines and in CI, not in production.',
    locations: [`backend/package.json:${lineOf(ROOT + '/backend/package.json', '"jest"')}`, `frontend/package.json:${lineOf(ROOT + '/frontend/package.json', '"vitest"')}`],
    impact_text: 'A malicious test or build input could affect developer machines and CI.', root_cause: 'Dev tooling not updated.',
    fix: 'Update jest, vitest and vite to the versions npm audit suggests, in a separate pull request, and run both suites.', test: 'npm audit (all dependencies) shows no critical; both suites pass.', effort: 'M', fix_risk: 'medium' }],
  ['SEC-reportsguard', ['A-17'], 'security', null, 'U3', 'Reports routes rely on scope checks inside the service instead of a route guard.', 'W5', [], null, null, {}],
  ['SEC-input', ['A-18', 'A-19'], 'security', null, 'U3', 'Input handling hardening.', 'W5', [], null, null, {}],
  ['A11-enter', ['C-23'], 'accessibility', null, 'U2', 'A stray Enter key can confirm a destructive action; small fix.', 'W6', [], null, null, {}],
  ['A11-focus', ['C-24'], 'accessibility', null, 'U2', 'Keyboard users lose their place in dialogs.', 'W6', [], null, null, {}],
  ['UXD-help', ['C-19'], 'ux-design', null, 'U3', 'Breaks the help-on-every-screen standard.', 'W6', [], null, null, {}],
  ['UXD-links', ['C-20'], 'ux-design', null, 'U3', 'No deep links or Back button; needs a routing decision.', 'W6', [], null, 'D5', {}],
  ['CDH-god', ['B-16', 'C-21'], 'code-health', null, 'U3', 'No active exposure; slows every change.', 'W6', [], null, null, { title: 'Five files hold about 6,800 lines of tangled logic' }],
  ['CDH-colors', ['C-18'], 'code-health', null, 'U3', 'Hard-coded colours break theming.', 'W6', [], null, null, {}],
  ['PRF-split', ['C-22'], 'performance', null, 'U3', 'One 931 KB script loads before the first screen.', 'W6', [], null, null, { likelihood: 'Medium', impact: 'Low' }],
  ['TST-cov', ['C-13'], 'testing', null, 'U3', 'Backend coverage is below the 80% gate.', 'W6', [], null, null, {}],
  ['TST-e2e', ['C-14'], 'testing', null, 'U3', 'End-to-end tests run against a mocked API.', 'W6', [], null, null, {}],
];

// number IDs by dimension prefix in listed order
const PFX = { security: 'SEC', architecture: 'ARC', data: 'DAT', performance: 'PRF', reliability: 'REL', observability: 'OBS', testing: 'TST', 'cicd-supply-chain': 'OPS', dependencies: 'DEP', accessibility: 'A11', 'ux-design': 'UXD', cost: 'CST', compliance: 'CMP', 'code-health': 'CDH', documentation: 'DOC' };
const ctr = {}; const idOf = {};
for (const r of R) { const p = PFX[r[2]]; ctr[p] = (ctr[p] || 0) + 1; idOf[r[0]] = `${p}-${String(ctr[p]).padStart(3, '0')}`; }

const PRIMARY_ONLY = new Set(['SEC-hash', 'SEC-logs', 'SEC-audittrail', 'SEC-ratelimit']); // same issue found twice: keep the primary text, union the locations
const used = new Set();
const findings = R.map(([key, srcs, dim, sev, urg, reason, wave, blocked, chain, decision, ov]) => {
  const ss = (srcs || []).map((id) => src[id]); srcs && srcs.forEach((id) => { if (!src[id]) throw new Error('missing source ' + id); used.add(id); });
  const p = ss[0] || {};
  const merged = ss.length > 1;
  const locations = [...new Set(ss.flatMap((s) => s.locations || []))];
  const only1 = PRIMARY_ONLY.has(key);
  const evidence = (only1 ? ss.slice(0, 1) : ss).map((s, i) => (i ? 'Also found separately: ' : '') + s.evidence).join(' ');
  const fix = (only1 ? ss.slice(0, 1) : ss).map((s, i) => (i ? 'Also: ' : '') + s.fix).join(' ');
  const test = (only1 ? ss.slice(0, 1) : ss).map((s) => s.test).filter(Boolean).join(' ');
  const effort = ss.length ? EFF[Math.max(...ss.map((s) => EFF.indexOf(s.effort || 'S')))] : undefined;
  const severity = sev || (ss.length ? ss.map((s) => s.severity).sort((a, b) => SEVRANK[a] - SEVRANK[b])[0] : 'Medium');
  const confidence = ss.length ? (ss.some((s) => s.confidence === 'confirmed') ? 'confirmed' : ss[0].confidence) : 'confirmed';
  const f = {
    id: idOf[key], title: p.title, dimension: dim, repo: p.repo, severity, likelihood: p.likelihood, impact: p.impact, confidence,
    urgency: urg, urgency_reason: reason, evidence, locations, impact_text: p.impact_text, root_cause: p.root_cause, fix, test,
    effort, fix_risk: p.fix_risk || 'low', blocked_by: blocked.map((k) => idOf[k]), chain_id: chain || undefined,
    needs_decision: !!decision || undefined, decision_id: decision || undefined, status: 'open', _wave: wave, _key: key,
    references: ss.map((s) => `draft:${s.id}`),
  };
  if (merged && ss.some((s) => s.repo !== p.repo)) f.repo = 'backend+frontend';
  Object.assign(f, ov);
  for (const k of Object.keys(f)) if (f[k] === undefined) delete f[k];
  for (const k of ['title', 'evidence', 'fix', 'test', 'impact_text', 'root_cause', 'urgency_reason']) if (f[k]) f[k] = scrub(f[k]);
  return f;
});
for (const [id] of Object.entries(src)) if (!used.has(id)) console.warn('UNUSED draft:', id);

// waves
const W = [
  ['W0', 'Stop the exposure', 'Engineering', 'Contain credential exposure and close the CEFR approval hole.', ['Hashes cannot appear in any API response or new audit-log row (HTTP tests prove it).', 'A manager cannot change a CEFR result outside their scope (test).', 'The owner has scrubbed existing audit-log rows and rotated affected passwords (done by hand).', 'The owner has confirmed whether the demo logins exist in production, and removed them from the build.'], true, 'These four are U0: active exposure or a one-line fix. Everything else depends on trusting these basics.'],
  ['W1', 'Trust the pipeline and the tests', 'Engineering', 'Make delivery safe and add the HTTP role tests every later fix needs.', ['Only master publishes production images, and images are pinned by version.', 'An HTTP role-by-route test runs in CI against the real route chain.', 'The pipeline runs a dependency and image scan; npm audit --omit=dev shows no high or critical on backend.'], true, 'The tests and the pipeline are prerequisites: access and history fixes need them to be provable and safe to ship.'],
  ['W2', 'Access control and sessions', 'Engineering', 'Close the remaining approval, session and audit-trail gaps.', ['An approved skill cannot change without re-approval (test).', 'Logout and password change end refresh tokens (test).', 'User, role and password changes appear in the audit log.', 'Self-approval policy for senior roles is decided (D1) and enforced.'], true, 'These changes alter who can do what, so they follow the role tests from W1.'],
  ['W3', 'Make scores trustworthy', 'Engineering', 'Make the assessment write atomic and remove invented or duplicated numbers.', ['Assessment write and score recompute succeed or fail together (test).', 'No screen shows an invented width or a recomputed readiness rule.', 'Absent data shows as absent, never as zero.'], true, 'Atomicity must exist before the history change (W4). The data-truth fixes are small and visible.'],
  ['W4', 'Appraisal history', 'Engineering', 'Keep results per period and make locked periods and scoring config truly immutable.', ['Re-assessing in period 2 leaves period 1 untouched (test).', 'A locked period cannot be changed even by direct database writes.', 'Editing weights does not change a locked period\'s results (test).', 'Migration proven on a local disposable database with before/after counts.'], true, 'Highest fix risk and a data migration: it goes after tests and the atomic write, and starts with a plan you approve.'],
  ['W5', 'Platform hardening', 'Engineering', 'Harden containers, headers, backups, errors and the AI integration.', ['Both images run as non-root on pinned bases.', 'CSP and security headers are in place; port 4000 is not public.', 'Backups are protected and have retention.', 'Errors returned to clients carry no internal detail.'], false, 'Real but not urgent; can be done in parallel by a second person once W1 is in.'],
  ['W6', 'UI quality and maintainability', 'UI/UX', 'Fix dialog accessibility, help coverage, routing and the largest files.', ['Confirm dialog ignores stray Enter; focus is trapped and restored.', 'Every screen has its Help button.', 'Initial JavaScript is split.'], false, 'Lowest exposure. The routing decision (D5) may change the scope, so it comes last.'],
];
const DEV = { S: 0.5, M: 2, L: 5 };
const waves = W.map(([id, name, track, goal, exit, checkpoint, why]) => {
  const ids = findings.filter((f) => f._wave === id).map((f) => f.id);
  const days = findings.filter((f) => f._wave === id).reduce((a, f) => a + DEV[f.effort || 'S'], 0);
  return { id, name, track, goal, ids, effort: `about ${days} dev-days (rough, from S/M/L sizes)`, exit_criteria: exit, checkpoint, why_order: why };
});
findings.forEach((f) => { delete f._wave; delete f._key; });

// chains
const I = (k) => idOf[k];
const chains = [
  { id: 'CHAIN-1', title: 'A leaked hash becomes a lasting account takeover', steps: ['An admin or any caller of the assignment endpoints reads password hashes from API responses.', 'The same hashes are stored in the audit log and persist.', 'Login lockout and username leaks help an attacker pick targets.', 'A password reset does not end existing sessions.'], ids: [I('SEC-hash'), I('SEC-auditlog'), I('SEC-lockout'), I('SEC-revoke')], break_at: I('SEC-hash') },
  { id: 'CHAIN-2', title: 'Approvals can be bypassed and nobody can tell', steps: ['Any manager can set a CEFR result for anyone.', 'An engineer can change an approved skill through the create route.', 'Senior roles can approve themselves.', 'User and role changes are not logged.'], ids: [I('SEC-cefr'), I('SEC-approved-edit'), I('SEC-senior'), I('SEC-audittrail')], break_at: I('SEC-cefr') },
  { id: 'CHAIN-3', title: 'Scores can be wrong or lost without any signal', steps: ['A recompute error is swallowed after the assessment is saved.', 'Two simultaneous saves can overwrite each other.', 'Re-assessment overwrites past periods.', 'Editing weights changes old results.'], ids: [I('REL-atomic'), I('REL-concurrent'), I('DAT-history'), I('DAT-version')], break_at: I('REL-atomic') },
  { id: 'CHAIN-4', title: 'A bad release reaches production with no way back', steps: ['A stale main branch can publish production images.', 'Deploys default to the moving latest tag.', 'Production migrations run with no backup step.', 'Backups sit unprotected with no retention.'], ids: [I('OPS-main'), I('OPS-latest'), I('REL-migrate'), I('DAT-backup')], break_at: I('OPS-main') },
];

const decisions = [
  { id: 'D0', question: 'Do the five demo logins (one per role, including an Admin; see DemoAccounts.tsx lines 7 to 11) exist in production with the shared test password? Only you can check.', options: ['Yes: change those passwords and remove the demo list from the build.', 'No: remove the demo list from the build anyway.'], recommended: 'Check production now; remove the list from production builds either way.', blocks: [I('SEC-demo')], needed_by: 'W0' },
  { id: 'D1', question: 'Who approves the self-assessments of ADMIN and TOP_MANAGEMENT users?', options: ['Another admin or top manager (four-eyes).', 'They may self-approve, but it is logged and reported.', 'A named approver role.'], recommended: 'Four-eyes: another admin or top manager approves.', blocks: [I('SEC-senior')], needed_by: 'W2' },
  { id: 'D2', question: 'Which registry replaces the personal Docker Hub namespace for production images?', options: ['Bitbucket registry', 'AWS ECR', 'GitHub Container Registry', 'A company Docker Hub organization'], recommended: 'A company-owned registry that your CI already authenticates to.', blocks: [I('OPS-registry')], needed_by: 'W5' },
  { id: 'D3', question: 'How should database backups be stored, encrypted and retained?', options: ['Encrypted object storage with 30 day retention', 'Encrypted VM disk with 14 day retention', 'Another policy'], recommended: 'Encrypted, off-host, with a tested restore and a stated retention period.', blocks: [I('DAT-backup')], needed_by: 'W5' },
  { id: 'D4', question: 'Which rule defines "ready" on screen?', options: ['The backend field (promotion_ready / meetsAllChecks) everywhere; screens never recompute.'], recommended: 'The backend field, as your metric rules already say.', blocks: [I('DAT-ready-fe')], needed_by: 'W3' },
  { id: 'D5', question: 'Should the app get real URLs per screen (deep links, Back button)?', options: ['Yes: one route per tab and Setup section.', 'No: keep the single-page tab model.'], recommended: 'Yes, in a later wave; it also simplifies access checks.', blocks: [I('UXD-links')], needed_by: 'W6' },
  { id: 'D6', question: 'For appraisal history: should a new period start with a copy of the last period\'s assessments, and how many periods are kept?', options: ['Copy forward and keep all periods.', 'Start empty each period.'], recommended: 'Copy forward and keep all periods; show the migration plan first.', blocks: [I('DAT-history')], needed_by: 'W4' },
];

// strengths (dedupe by title)
const seen = new Set(); const strengths = [];
for (const a of ['A', 'B', 'C']) for (const s of rd(`agent-${a}-strengths.json`)) { const k = s.title.toLowerCase(); if (seen.has(k)) continue; seen.add(k); strengths.push({ title: scrub(s.title), detail: scrub(s.detail), locations: s.locations }); }

// coverage
const cov = ['A', 'B', 'C'].map((a) => rd(`agent-${a}-coverage.json`));
const coverage = {
  reviewed: [
    { area: 'Project checks (type-check, lint, tests with coverage), both repos', depth: 'run' },
    { area: 'gitleaks (history), npm audit, trivy fs, both repos', depth: 'run' },
    ...cov.flatMap((c) => c.reviewed || []).filter((r) => r && r.area),
  ],
  skipped: [
    { area: 'Cost', reason: 'Only OpenAI usage; folded into the AI finding.' },
    { area: 'Compliance', reason: 'No framework declared; employee data treated as personal.' },
    { area: 'Tools not installed', reason: 'semgrep, osv-scanner, hadolint, jscpd, madge, cloc, syft, checkov, trufflehog were not run; duplication, import cycles and licences were not measured.' },
    { area: 'Depth', reason: 'Quick depth: the five critical flows were traced; the other modules were sampled, not read line by line.' },
    { area: 'Production environment', reason: 'No access by design: live nginx, firewall, production data and backups were not examined.' },
  ],
  gaps: 'Not verified: ' + [...new Set(cov.flatMap((c) => c.not_verified || []))].map(scrub).join(' | '),
};

const sev = (s) => findings.filter((f) => f.severity === s).length;
const summary = {
  headline: `ERP is well tested and carefully structured, but ${sev('High')} High findings (password hashes in API responses and audit logs, an unscoped CEFR approval route, overwritten appraisal history, a non-atomic score update, and demo logins in the production bundle) need fixing before the platform is relied on.`,
  overall_grade: 'D',
  grade_note: `Rule used: no Critical findings, but three or more High findings means D. ${sev('High')} High, ${sev('Medium')} Medium, ${sev('Low')} Low.`,
  top_risks: [
    { text: 'Password hashes are sent in admin API responses and saved in the audit log.', ids: [I('SEC-hash'), I('SEC-auditlog')] },
    { text: 'Any manager can change or approve any employee\'s CEFR assessment.', ids: [I('SEC-cefr')] },
    { text: 'Test logins for admin-level employee codes ship inside the production JavaScript bundle.', ids: [I('SEC-demo')] },
    { text: 'Appraisal history is overwritten, and an assessment save can leave scores stale with no error.', ids: [I('DAT-history'), I('REL-atomic')] },
    { text: 'There are no HTTP role-by-route tests, and a stale main branch can also publish production images.', ids: [I('TST-http'), I('OPS-main')] },
  ],
  do_this_week: [
    `Stop returning password hashes and stop writing them to the audit log (${I('SEC-hash')}, ${I('SEC-auditlog')}); then scrub old log rows and rotate passwords yourself.`,
    `Add the scope check to the CEFR status route (${I('SEC-cefr')}).`,
    `Check whether the demo logins exist in production, and remove the demo list from production builds (${I('SEC-demo')}).`,
    `Make master the only branch that publishes production images (${I('OPS-main')}).`,
  ],
  fix_first: [
    ['SEC-hash', 'Active exposure; the fix is one shared safe-select. Starts the chain.'],
    ['SEC-auditlog', 'Stops new hashes entering logs; the owner scrubs old rows.'],
    ['SEC-cefr', 'One missing scope check; closes a live approval hole.'],
    ['SEC-demo', 'Cheap, and only the owner can check production.'],
    ['TST-http', 'Prerequisite for proving every access-control fix.'],
    ['OPS-main', 'One pipeline edit removes an unreviewed path to production.'],
    ['SEC-approved-edit', 'Closes the way an approved score can change silently.'],
    ['REL-atomic', 'Must exist before the appraisal-history change.'],
    ['DEP-be', 'Cheap upgrade; needed before fixing proxy trust.'],
    ['SEC-revoke', 'Makes a password reset actually end sessions.'],
  ].map(([k, reason]) => ({ id: idOf[k], reason })),
};
const scorecard = [
  ['security', 1.5, 'Hashes in responses and logs, an unscoped approval route, weak session handling.'],
  ['data', 2, 'History overwritten, locked periods only locked in code, config unversioned.'],
  ['reliability', 2.5, 'Swallowed recompute errors, no concurrency control, abrupt shutdown.'],
  ['testing', 2.5, 'Many tests (548 backend, 2,334 frontend), but no HTTP or role-by-route tests; backend 66% lines.'],
  ['cicd-supply-chain', 2, 'Root containers, floating tags, stale main branch deploys, personal registry.'],
  ['dependencies', 2.5, 'Known flaws in production packages; no scan step in CI.'],
  ['architecture', 2.5, 'Clean module slices, but five very large files and logic duplicated across tiers.'],
  ['performance', 3, 'Per-competency recompute and compute-on-read reports; one large initial script.'],
  ['observability', 2, 'Logs not redacted, raw errors to clients, no audit trail for user changes.'],
  ['accessibility', 2, 'Confirm on any Enter key; no focus trapping in dialogs.'],
  ['ux-design', 2.5, 'Single URL with no deep links; help modals missing on many screens.'],
  ['code-health', 2.5, 'Very large files; widespread hard-coded colours.'],
].map(([dimension, score, why]) => ({ dimension, score, why }));

const tools = [
  { name: 'gitleaks', version: '8.30.1', purpose: 'Secrets in code and history', result: '0 leaks in both repos' },
  { name: 'trivy fs', version: '0.69.3', purpose: 'Dependency vulnerabilities and misconfiguration', result: 'Backend 1 critical, 8 high; frontend 0 critical, 9 high; both Dockerfiles run as root' },
  { name: 'npm audit', version: npmV, purpose: 'Dependency vulnerabilities (read-only)', result: 'Production deps: backend 1 critical, 3 high; frontend 0 critical, 7 high' },
  { name: 'tsc / eslint / jest / vitest', version: 'project-pinned', purpose: 'Project checks', result: 'Type-check and lint pass; 548 and 2,334 tests pass' },
];
const baselines = {
  backend_tests: '548 passed, 37 suites, 0 failed',
  backend_line_coverage_percent: 66.08,
  backend_branch_coverage_percent: 55.14,
  frontend_tests: '2,334 passed, 136 files, 0 failed',
  frontend_line_coverage_percent: 83.42,
  frontend_lint: '0 errors, 91 warnings',
  type_errors: '0 in both repos',
  gitleaks_leaks: 0,
  npm_audit_production: 'backend 8 (1 critical, 3 high); frontend 11 (0 critical, 7 high)',
};

const deepScrub = (v) => (typeof v === 'string' ? scrub(v) : Array.isArray(v) ? v.map(deepScrub) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepScrub(x)])) : v);
fs.writeFileSync(path.join(RUN, 'findings.json'), JSON.stringify(deepScrub({ summary, scorecard, findings, chains, waves, decisions, strengths, coverage, tools, baselines }), null, 2) + '\n');
fs.writeFileSync(path.join(RUN, 'report.config.json'), JSON.stringify({
  title: 'ERP (erp) audit', project: 'ERP', date: '2026-10-07', mode: 'AUDIT-ONLY',
  scope: 'backend + frontend on master, quick depth, five critical flows', auditor: 'AI audit agent (three parallel reviewers), High findings verified by hand',
  confidentiality: 'Confidential', kit_version: fs.readFileSync(path.join(ROOT, 'audit/kit/VERSION'), 'utf8').trim(),
  team_size: 1, release_cadence: 'as needed',
  repos: [{ name: 'backend', branch: 'master', commit: '227b698' }, { name: 'frontend', branch: 'master', commit: '45ae7f7' }], previous_run: null,
}, null, 2) + '\n');
console.log('findings:', findings.length, 'High', sev('High'), 'Medium', sev('Medium'), 'Low', sev('Low'), '| waves', waves.map((w) => `${w.id}:${w.ids.length}`).join(' '));
