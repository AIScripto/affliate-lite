import fs from 'node:fs';
const ROOT = '/Users/tk-lpt-1088/development/react/erp/ERP';
const W = (br) => br;
const BE = {
  'TST-001': ['fixed (on master)', 'fix/w1-pipeline-tests', 'merge e0ee06e', 'src/app.route-guards.test.ts (57 tests: public routes, ratchet, 401 on 127 routes, role matrix)', 'Mutation-checked four ways.'],
  'OPS-001': ['fixed (on master)', 'fix/w1-pipeline-tests', 'merge e0ee06e', 'src/ci/pipelines.policy.test.ts', 'OWNER: retire the stale `main` branch and set the default branch.'],
  'OPS-002': ['partly fixed (on master)', 'fix/w1-pipeline-tests', 'merge e0ee06e', 'src/ci/pipelines.policy.test.ts', 'Tag builds no longer push :latest. The compose and deploy-script part is a patch for the owner (ops-002-workspace.patch), not applied.'],
  'OPS-003': ['fixed (on master)', 'fix/w1-pipeline-tests', 'merge e0ee06e', 'src/ci/pipelines.policy.test.ts, src/ci/docker-login.test.ts', 'Scanners pinned, trivy step, one login script. OWNER: name the real Docker Hub variables so the unused spellings can go.'],
  'DEP-001': ['fixed (on master)', 'fix/w1-pipeline-tests', 'merge e0ee06e', 'npm audit --omit=dev: 0; full suite', '8 packages updated inside their ranges.'],
  'SEC-005': ['fixed (on branch)', 'fix/w2-access-sessions', '5eb6833', 'assessment.service.approvals.test.ts (17)', 'Editing an approved skill sends it to pending; the level is kept. Behaviour: the skill stops counting toward the score until re-approved.'],
  'SEC-006': ['fixed (on branch)', 'fix/w2-access-sessions', '5eb6833, 4a49ff1', 'approval-rules.test.ts (17), assessment.controller.approvals.test.ts (27), communication and behavioral controller tests', 'Decision D1 (four-eyes): nobody approves their own record, at any role.'],
  'SEC-007': ['fixed (on branch)', 'fix/w2-access-sessions', '5eb6833, 4a49ff1', 'same as SEC-006', 'Peer managers cannot approve each other (skills, CEFR, behavioral). ADMIN and TOP_MANAGEMENT are not peers.'],
  'SEC-008': ['fixed (on branch)', 'fix/w2-access-sessions', '951c822 (backend), de5ed06 (frontend)', 'auth.service.sessions.test.ts, auth.controller.test.ts; frontend session.test.ts, DashboardPage.test.tsx', 'Logout ends only this browser\'s session.'],
  'SEC-009': ['partly fixed (on branch)', 'fix/w2-access-sessions', '721c209, 951c822', 'auth.service.sessions.test.ts, config.service.users.test.ts', 'Password change (self and admin reset) ends the other sessions. NOT done by decision: refresh-token rotation.'],
  'SEC-010': ['fixed (on branch)', 'fix/w2-access-sessions', '841672f', 'src/config/logger.test.ts', 'Tokens and cookies redacted from request logs.'],
  'SEC-011': ['fixed (on branch)', 'fix/w2-access-sessions', '7006acd, 5da42f9', 'app.proxy-and-limits.test.ts, app.proxy-hops.test.ts, env.hops.test.ts', 'trust proxy via TRUST_PROXY_HOPS (default 1). OWNER: confirm the proxy layout; this nginx proxies /api straight to the API (1 hop).'],
  'SEC-012': ['patch delivered, not applied', '', '', 'nginx -t on original and patched copy', 'OWNER: apply sec-012-nginx.patch (see its README).'],
  'SEC-013': ['partly fixed (on branch)', 'fix/w2-access-sessions', '951c822', 'auth.service.sessions.test.ts (11 login cases)', 'No username enumeration, lock order, lock reset. NOT done: per-address failure counting (needs a shared store).'],
  'SEC-014': ['partly fixed (on branch)', 'fix/w2-access-sessions', '4a49ff1', 'behavioral.controller.test.ts, behavioral.service.window.test.ts', '404 for unknown subjects, submission window. NOT done: id-only-by-code lookup and a period column (needs a migration).'],
  'SEC-015': ['fixed (on branch)', 'fix/w2-access-sessions', '5eb6833', 'assessment.service.approvals.test.ts, assessment.controller.approvals.test.ts', 'Delete needs an open window, is audited, and is blocked for approved/pending on one\'s own record.'],
  'SEC-016': ['fixed (on branch)', 'fix/w2-access-sessions', '721c209', 'config.service.users.test.ts (14), config.controller.test.ts', 'User changes audited; the last active ADMIN cannot be removed.'],
};
const FE = {
  'DEP-002': ['mostly fixed (on master)', 'fix/w1-pipeline-tests', 'merge e43866c', 'npm audit --omit=dev: 11 -> 9; full suite', 'Remaining 9: Tailwind 3 chain and one SSR-only router advisory.'],
  'OPS-001': ['fixed (on master)', 'fix/w1-pipeline-tests', 'merge e43866c', 'scripts/pipelines.policy.test.ts', ''],
  'OPS-002': ['partly fixed (on master)', 'fix/w1-pipeline-tests', 'merge e43866c', 'scripts/pipelines.policy.test.ts', 'See backend log.'],
  'OPS-003': ['fixed (on master)', 'fix/w1-pipeline-tests', 'merge e43866c', 'scripts/pipelines.policy.test.ts, scripts/docker-login.test.ts', 'Also runs check:no-demo after the build.'],
  'SEC-008': ['fixed (on branch)', 'fix/w2-access-sessions', 'de5ed06', 'src/lib/session.test.ts (3), src/pages/DashboardPage.test.tsx', 'Backend counterpart in the backend log.'],
};
for (const [repo, upd] of [['backend', BE], ['frontend', FE]]) {
  const p = `${ROOT}/${repo}/REMEDIATION_LOG.md`;
  let s = fs.readFileSync(p, 'utf8');
  let n = 0;
  s = s.split('\n').map((line) => {
    const m = line.match(/^\| ([A-Z0-9]+-\d+) \| (\w+) \|/);
    if (!m || !upd[m[1]]) return line;
    const old = line.split('|').map((x) => x.trim());
    const [st, br, c, t, note] = upd[m[1]];
    n++;
    return `| ${m[1]} | ${m[2]} | ${st} | ${br} | ${c} | ${t} | ${note || old[7] || ''} |`;
  }).join('\n');
  s = s.replace(/Wave in progress: \*\*W0\*\*[^\n]*/, 'Waves: **W0 and W1 are on master (1.1.0, no tag). W2 is on branch `fix/w2-access-sessions`, not pushed or merged.**');
  fs.writeFileSync(p, s);
  console.log(repo, 'rows updated:', n);
}
