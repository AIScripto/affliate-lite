/**
 * Command line:
 *   npm run test:all            run every scenario, print a table, exit 1 if any failed
 *   npm run test:all -- retry   run only the listed scenario IDs
 *   npm run cleanup             delete the sandbox offers (and their clicks and conversions)
 */
import { config } from './config';
import { trackerAdmin } from './tracker/admin';
import { SCENARIOS } from './scenarios/catalog';
import { runScenarios } from './scenarios/runner';
import { ScenarioResult } from './scenarios/types';

const MARK = { pass: 'PASS', fail: 'FAIL', skipped: 'SKIP', 'not-run': ' -- ' } as const;

function print(results: ScenarioResult[]): void {
  for (const r of results) {
    console.log(`\n${r.passed ? 'PASS' : 'FAIL'}  ${r.title}  (${r.durationMs} ms)${r.clickId ? `  click ${r.clickId}` : ''}`);
    for (const s of r.steps) console.log(`   ${MARK[s.outcome]}  ${s.label} — ${s.detail}`);
  }
  const passed = results.filter((r) => r.passed).length;
  console.log(`\n${passed} of ${results.length} tests passed · tracker ${config.trackerUrl}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--cleanup')) {
    const { deletedOffers } = await trackerAdmin.cleanup();
    console.log(deletedOffers.length ? `Deleted: ${deletedOffers.join(', ')}` : 'Nothing to delete');
    return;
  }
  const ids = args.filter((a) => !a.startsWith('--'));
  const unknown = ids.filter((id) => !SCENARIOS.some((s) => s.id === id));
  if (unknown.length) {
    console.error(`Unknown test(s): ${unknown.join(', ')}\nAvailable: ${SCENARIOS.map((s) => s.id).join(', ')}`);
    process.exit(2);
  }
  await trackerAdmin.ensureFixtures();
  const results = await runScenarios(ids.length ? SCENARIOS.filter((s) => ids.includes(s.id)) : SCENARIOS, trackerAdmin);
  print(results);
  process.exit(results.every((r) => r.passed) ? 0 : 1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
