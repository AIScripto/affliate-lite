/**
 * Command line:
 *   npm run test:all            run every scenario, print a table, exit 1 if any failed
 *   npm run test:all -- retry   run only the listed scenario IDs (add --local to skip the server)
 *   npm run cleanup             delete the sandbox offers (and their clicks and conversions)
 *
 * When a sandbox server is running on this machine, tests run inside it: that server is the
 * process that receives the tracker's publisher postbacks, so only it can check them.
 * Add --local to run in this process instead (publisher checks then see nothing).
 */
import { config } from './config';
import { trackerAdmin } from './tracker/admin';
import { SCENARIOS } from './scenarios/catalog';
import { runScenarios } from './scenarios/runner';
import { ScenarioResult } from './scenarios/types';
import { request, asRecord } from './tracker/http';

const MARK = { pass: 'PASS', fail: 'FAIL', skipped: 'SKIP', 'not-run': ' -- ' } as const;

function print(results: ScenarioResult[]): void {
  for (const r of results) {
    console.log(`\n${r.passed ? 'PASS' : 'FAIL'}  ${r.title}  (${r.durationMs} ms)${r.clickId ? `  click ${r.clickId}` : ''}`);
    for (const s of r.steps) console.log(`   ${MARK[s.outcome]}  ${s.label} — ${s.detail}`);
  }
  const passed = results.filter((r) => r.passed).length;
  console.log(`\n${passed} of ${results.length} tests passed · tracker ${config.trackerUrl}`);
}

const SERVER = `http://localhost:${config.port}`;
const RUN_TIMEOUT_MS = 15 * 60 * 1000;

async function runHere(ids: string[]): Promise<ScenarioResult[]> {
  await trackerAdmin.ensureFixtures();
  return runScenarios(ids.length ? SCENARIOS.filter((s) => ids.includes(s.id)) : SCENARIOS, trackerAdmin);
}

/** Runs through the local sandbox server when one is up; returns null when there is none. */
async function runOnServer(ids: string[]): Promise<ScenarioResult[] | null> {
  try {
    if ((await request(`${SERVER}/health`)).status !== 200) return null;
  } catch {
    return null;
  }
  if (!config.password) throw new Error('A sandbox server is running but SANDBOX_PASSWORD is not set here. Set it, or add --local.');
  console.log(`Running inside the sandbox server at ${SERVER} …`);
  const headers = { 'Content-Type': 'application/json', Authorization: `Basic ${Buffer.from(`cli:${config.password}`).toString('base64')}` };
  await fetch(`${SERVER}/api/setup`, { method: 'POST', headers });
  const all: ScenarioResult[] = [];
  for (const id of ids.length ? ids : ['all']) {
    const res = await fetch(`${SERVER}/api/run`, { method: 'POST', headers, body: JSON.stringify({ id }), signal: AbortSignal.timeout(RUN_TIMEOUT_MS) });
    const body = asRecord(await res.json());
    if (!res.ok) throw new Error(`Sandbox server answered ${res.status}: ${String(body.message ?? '')}`);
    all.push(...(body.results as ScenarioResult[]));
  }
  return all;
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
  const results = args.includes('--local') ? await runHere(ids) : ((await runOnServer(ids)) ?? (await runHere(ids)));
  print(results);
  process.exit(results.every((r) => r.passed) ? 0 : 1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
