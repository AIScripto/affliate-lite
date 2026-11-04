// Generates REMEDIATION_LOG.md in each repo from findings.json. In text below, § stands for a backtick.
import fs from 'node:fs';
const ROOT = '/Users/tk-lpt-1088/development/react/erp/ERP';
const d = JSON.parse(fs.readFileSync(`${ROOT}/audit/results/2026-10-07_erp_quick/findings.json`, 'utf8'));
const waveOf = {};
d.waves.forEach((w) => w.ids.forEach((i) => (waveOf[i] = w.id)));

const fixed = {
  'SEC-001': { br: 'fix/w0-security-exposure', c: '623ad5f', t: "user-select.test.ts (source guard + column accounting); config.service.test.ts 'Secrets never leave the service' (6 tests)", n: '22 nested user relations and 6 top-level user queries now use select. The frontend never read the removed fields (searched).' },
  'SEC-002': { br: 'fix/w0-security-exposure', c: '623ad5f, a524ce1', t: 'strip-secrets.test.ts; config.service.test.ts (audit-log tests); scrub-audit-log-secrets.test.ts (12 tests)', n: 'OWNER: run the scrub script on production (dry run first, then --apply with CONFIRM_SCRUB_HOST) and rotate all passwords. Not run by the agent.' },
  'SEC-003': { br: 'fix/w0-security-exposure', c: '1065540', t: "communication.controller.test.ts 'scope check' (4 tests; 3 failed before the fix)", n: 'The scope check runs after the self-approval check, so own-record attempts keep SELF_APPROVAL_PROHIBITED. TOP_MANAGEMENT follows the assessment-mode rule used by every other CEFR route.' },
  'SEC-004': { br: 'fix/w0-demo-accounts', c: '43da81a', t: 'npm run check:no-demo (fails on a fresh master build, passes after); LoginPage.test.tsx (production test fails on old code); check-no-demo-accounts.test.ts', n: 'OWNER (D0): check whether the five demo logins exist in production and change their passwords. Add check:no-demo to CI in W1.' },
};

const rows = (repo) =>
  d.findings
    .filter((f) => (repo === 'backend' ? ['backend', 'backend+frontend', 'workspace'].includes(f.repo) : ['frontend', 'backend+frontend'].includes(f.repo)))
    .sort((a, b) => a.sequence - b.sequence);

const BE = {
  base: '227b698', branch: 'fix/w0-security-exposure',
  baseline: `| Tests | 548 passed, 37 suites | npm run test:coverage |
| Line coverage | 66.08% (branches 55.14%, functions 71.72%) | same |
| Type errors / lint errors | 0 / 0 | type-check, lint |
| Production dependency issues | 8 (1 critical, 3 high, 4 moderate) | npm audit --omit=dev |`,
  after: `| Tests | 578 passed, 40 suites (+30) |
| Line coverage | 66.72% (branches 56.10%, functions 71.94%): not lower than baseline |
| New files | user-select.ts, strip-secrets.ts, scrub-audit-log-secrets.ts: 100% lines |
| Type-check / lint | pass / 0 errors |`,
  contract: `| W0 | User objects in GET/POST/PATCH /config/users, the department and line-manager assignment lists, and the audit-log list no longer include password_hash, password_reset_token, reset_token_expires, login_attempts or locked_until. | Yes for this frontend: it never read them (searched frontend/src). | None needed. |
| W0 | PATCH /comm/assessments/:id/status returns 403 §Access denied§ for an employee outside the caller's assessment scope. | Behaviour change by design. | None needed. |`,
  manual: `| Run §npx tsx src/scripts/scrub-audit-log-secrets.ts§ against production (dry run first, then §--apply§ with §CONFIRM_SCRUB_HOST=<host>§) | Existing audit rows may hold password hashes | |
| Rotate every user's password | The hashes were readable through the API and the audit-log screen | |`,
};
const FE = {
  base: '45ae7f7', branch: 'fix/w0-demo-accounts',
  baseline: `| Tests | 2,334 passed, 136 files | vitest --coverage |
| Line coverage | 83.42% (branches 94.51%, functions 92.25%) | same |
| Type errors / lint errors | 0 / 0 (91 warnings) | type-check, lint |
| Production dependency issues | 11 (0 critical, 7 high, 4 moderate) | npm audit --omit=dev |`,
  after: `| Tests | 2,342 passed, 138 files (+8) |
| Line coverage | 83.87% (branches 94.49%, functions 92.16%): not lower than baseline |
| Type-check / lint / build | pass / 0 errors (91 warnings, same as baseline) / pass |
| Bundle check | §npm run check:no-demo§ passes on the new build |`,
  contract: '| W0 | None. The demo accounts are removed from production builds only. | n/a | n/a |',
  manual: `| Check whether the five demo logins exist in production, and change their passwords if so (decision D0) | The logins and the shared test password were in the shipped bundle | |
| Add §npm run check:no-demo§ to the pipeline after §npm run build§ (W1) | Keeps the demo list out of every future build | |`,
};

for (const [repo, c] of [['backend', BE], ['frontend', FE]]) {
  let s = `# Remediation log: ${repo}

Audit run: 2026-10-07_erp_quick · Kit 0.1.0 · Base: §master§ ${c.base}
Wave in progress: **W0** (branch §${c.branch}§, local only: not pushed, not merged)

## Baseline (before any fix, 2026-10-07)

| Measure | Value | Source |
|---|---|---|
${c.baseline}

## After W0 (2026-10-07)

| Measure | Value |
|---|---|
${c.after}

## Findings

| ID | Sev | Status | Branch | Commit(s) | Test(s) proving it | Notes |
|---|---|---|---|---|---|---|
`;
  for (const f of rows(repo)) {
    const x = fixed[f.id];
    const st = x ? 'fixed (on branch, awaiting your approval)' : f.needs_decision ? `needs-decision (${f.decision_id})` : 'todo';
    const note = x ? x.n : `${waveOf[f.id] || ''} · ${f.title.slice(0, 70)}${f.repo === 'workspace' ? ' (workspace-level)' : ''}`;
    s += `| ${f.id} | ${f.severity} | ${st} | ${x ? x.br : ''} | ${x ? x.c : ''} | ${x ? x.t : ''} | ${note} |\n`;
  }
  s += `
## Contract changes

| Wave | Change | Backward compatible? | Consumers updated |
|---|---|---|---|
${c.contract}

## Manual actions for the owner (not done by the agent)

| Action | Why | Done by / date |
|---|---|---|
${c.manual}
| Push the branch, open the pull request, merge, run §npm version§ | Needs your approval | |

## Wave summaries

W0: see §audit/results/2026-10-07_erp_quick/w0-summary.md§ in the workspace root.
`;
  fs.writeFileSync(`${ROOT}/${repo}/REMEDIATION_LOG.md`, s.replaceAll('§', '`'));
  console.log(repo, 'rows:', rows(repo).length);
}
