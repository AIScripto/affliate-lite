import fs from 'node:fs';
const ROOT = '/Users/tk-lpt-1088/development/react/erp/ERP';
const BR = 'fix/w3-score-integrity';
const BE = {
  'REL-001': ['fixed (on branch)', BR, 'c729f04', 'assessment.service.atomic.test.ts (31, all failed before)', 'Write and recompute are one transaction; a failed recompute fails the request and rolls the write back. Rows the dev DB: snapshot before/after identical.'],
  'REL-002': ['fixed (on branch)', BR, 'c729f04', 'assessment.service.atomic.test.ts + real lock check on the dev DB', 'Per-employee pg_advisory_xact_lock. Checked on the dev DB: a second save for the same person waited 800 ms, another person was not blocked.'],
  'PRF-001': ['fixed (on branch)', BR, 'c729f04', 'score-recalculation.service.test.ts (6 new), atomic tests', 'Only the touched competency is recomputed; whole-employee fallback when the competency is unknown.'],
  'DAT-002': ['fixed (on branch)', BR, '0069977, 26c0960', 'reports.service.test.ts (6 new), rounding.test.ts (9)', 'No data is null, not 0. One roundHalfUp (src/scoring/rounding.ts). YoY scores through computeCompetencyScore with configured statuses. Dev DB: YoY latest period equals the live score for 30 of 30 people. Still open: a person whose real score is exactly 0 counts as "not assessed" in the exec summary (assessed = overall_score > 0).'],
  'DAT-003': ['fixed (on branch, backend half)', BR, '26c0960', 'report-row.helpers.readiness.test.ts, reports.service.test.ts', 'Backend sends ready_all_checks and near_ready (one rule, one 75% constant). Gap Matrix rows get near_ready; their "ready" filter stays technical-only (no CEFR or behaviour data on that report).'],
};
const FE = {
  'DAT-001': ['fixed (on branch)', BR, '42e21e7', 'AIInsightsTab.test.tsx (2 updated), browser check', 'Each KPI bar uses its own percentage; the count tile has no bar; the 18% floor is gone.'],
  'DAT-003': ['fixed (on branch)', BR, '42e21e7', 'reportGroups.test.ts, cefrBenchmarksData.test.ts + 15 fixtures', 'Screens read ready_all_checks, near_ready, cefr_state from the backend; meetsAllChecks/isNearReady/cefr fallback logic deleted. Rounding in 4 cited files now uses roundHalfUp; the other Math.round calls and a lint rule are NOT done.'],
  'DAT-004': ['fixed (on branch)', BR, '42e21e7', 'EmployeesSection.test.tsx', 'Manager picker shows emp_code; no code, no number.'],
  'DAT-002': ['fixed (frontend half, on branch)', BR, '42e21e7', 'ExecutiveSummaryTab.test.tsx, browser check', 'Null averages show "Not assessed", no bar, no 0%; leaderboard sorts them last.'],
};
const contractBE = '| W3 | GET /reports/executive-summary: avgTechScore, expectedTechScore, techGap, cefrReadyRate, cefrGap, avgBehavScore, expectedBehavScore, behavGap, overallOrgScore, expectedOrgScore, cefrCurrentReadyRate are `null` (were 0) when nobody is measured. GET /reports/promotion-readiness rows add `ready_all_checks` and `near_ready`; gap-matrix rows add `near_ready`. | Not for old frontends: a frontend built before W3 shows nothing wrong for null (it prints "N/A" or 0%) but must ship together. | Frontend W3 branch. |';
const contractFE = '| W3 | Reads `ready_all_checks`, `near_ready`, `cefr_state` (now required) and nullable summary figures. | Needs the backend W3 first. **Deploy backend before frontend.** | n/a |';
for (const [repo, upd, contract] of [['backend', BE, contractBE], ['frontend', FE, contractFE]]) {
  const p = `${ROOT}/${repo}/REMEDIATION_LOG.md`;
  let s = fs.readFileSync(p, 'utf8'); let n = 0;
  s = s.split('\n').map((line) => {
    const m = line.match(/^\| ([A-Z0-9]+-\d+) \| (\w+) \|/);
    if (!m || !upd[m[1]]) return line;
    const old = line.split('|').map((x) => x.trim());
    const [st, br, c, t, note] = upd[m[1]]; n++;
    return `| ${m[1]} | ${m[2]} | ${st} | ${br} | ${c} | ${t} | ${note || old[7] || ''} |`;
  }).join('\n');
  s = s.replace(/(## Contract changes\n\n\|[^\n]*\n\|[^\n]*\n(?:\|[^\n]*\n)*)/, (blk) => blk + contract + '\n');
  s = s.replace(/Waves: \*\*W0 and W1 are on master[^\n]*/, 'Waves: **W0 and W1 are on master (1.1.0, no tag). W2 (`fix/w2-access-sessions`) is on staging. W3 is on branch `fix/w3-score-integrity` (stacked on W2), not pushed.**');
  fs.writeFileSync(p, s); console.log(repo, 'rows updated:', n);
}
