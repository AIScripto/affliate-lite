import { config, TIMING, SANDBOX_PAYOUT, isPrivateAddress } from '../config';
import { store } from '../store';
import { TrackerAdmin, Fixtures } from '../tracker/admin';
import { makeClick, sendPostback, PostbackResult } from '../tracker/traffic';
import { Scenario, ScenarioContext, ScenarioResult, Step, StepResult } from './types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function describeResponse(res: PostbackResult): string {
  const msg = res.body.message ?? res.body.status ?? '';
  return `HTTP ${res.status}${msg ? ` · ${String(msg)}` : ''}`;
}

async function runStep(step: Step, ctx: ScenarioContext): Promise<StepResult> {
  if (step.kind === 'burst') {
    const results = await Promise.all(
      Array.from({ length: step.count }, () => sendPostback(step.profile, { clickId: ctx.clickId, ...step.input(ctx) }))
    );
    const codes = results.map((r) => r.status);
    const newOnes = results.filter((r) => r.status === 200 && !r.body.duplicate).length;
    const ok = codes.every((c) => c === 200) && newOnes === 1;
    return {
      label: step.label,
      outcome: ok ? 'pass' : 'fail',
      detail: ok
        ? `All ${step.count} answered 200; exactly 1 created, ${step.count - 1} duplicates`
        : `Answers ${codes.join(', ')}; ${newOnes} created (expected all 200 and exactly 1 created)`,
    };
  }

  const res = await sendPostback(step.profile, { clickId: ctx.clickId, ...step.input(ctx) });
  const base = { label: step.label, request: { method: res.method, url: res.url }, response: { status: res.status, body: res.body } };
  if (res.status !== step.expectStatus) {
    return { ...base, outcome: 'fail', detail: `Expected HTTP ${step.expectStatus}, got ${describeResponse(res)}` };
  }
  const problem = step.check?.(res.body, ctx) ?? null;
  return problem ? { ...base, outcome: 'fail', detail: problem } : { ...base, outcome: 'pass', detail: describeResponse(res) };
}

/** Every postback the sandbox sent for this click must appear in the tracker's postback log. */
async function checkTrackerLog(admin: TrackerAdmin, clickId: string): Promise<StepResult> {
  const sent = store.count('postback-sent', clickId);
  const logs = await admin.postbackLogs(clickId);
  const inbound = logs.filter((l) => l.direction === 'INBOUND').length;
  return {
    label: 'Tracker logged every postback',
    outcome: inbound === sent ? 'pass' : 'fail',
    detail: `${inbound} logged of ${sent} sent`,
  };
}

/** The tracker must call the fake publisher exactly as often as expected, with the offer's payout. */
async function checkPublisher(scenario: Scenario, clickId: string): Promise<StepResult> {
  const label = `Publisher received ${scenario.publisherPostbacks} postback(s)`;
  if (isPrivateAddress(config.publicUrl)) {
    return { label, outcome: 'skipped', detail: 'Sandbox address is local, so the tracker may not call it (security rule). Run on the server to check this.' };
  }
  const expected = scenario.publisherPostbacks;
  const deadline = Date.now() + (expected === 0 ? TIMING.publisherWaitMs / 3 : TIMING.publisherWaitMs);
  while (Date.now() < deadline && store.count('publisher-received', clickId) < expected) {
    await sleep(TIMING.publisherPollMs);
  }
  await sleep(TIMING.publisherPollMs * 2); // catch an unexpected extra one
  const received = store.list(50, clickId).filter((e) => e.type === 'publisher-received');
  if (received.length !== expected) {
    return { label, outcome: 'fail', detail: `Received ${received.length}, expected ${expected}` };
  }
  const wrong = received.find((e) => {
    const q = e.data.query as Record<string, string>;
    return Number(q.payout) !== SANDBOX_PAYOUT.payout || q.status !== 'APPROVED';
  });
  return wrong
    ? { label, outcome: 'fail', detail: `Wrong values: ${JSON.stringify(wrong.data.query)}` }
    : { label, outcome: 'pass', detail: expected ? `Payout ${SANDBOX_PAYOUT.payout}, status APPROVED` : 'None sent, as expected' };
}

export async function runScenario(scenario: Scenario, admin: TrackerAdmin, fixtures: Fixtures): Promise<ScenarioResult> {
  const started = Date.now();
  const steps: StepResult[] = [];
  let clickId: string | null = null;

  try {
    const click = await makeClick(fixtures.offers[scenario.offer], fixtures.publisherId, `${scenario.id}-${started.toString(36)}`);
    clickId = click.clickId;
    steps.push({ label: 'Visitor clicks the tracking link', outcome: 'pass', detail: `Redirected to the advertiser page with click ${clickId}` });

    const ctx: ScenarioContext = { clickId, token: config.offerToken, memo: {} };
    let failed = false;
    for (const step of scenario.steps) {
      if (failed) {
        steps.push({ label: step.label, outcome: 'not-run', detail: 'Skipped because an earlier step failed' });
        continue;
      }
      const result = await runStep(step, ctx);
      steps.push(result);
      failed = result.outcome === 'fail';
    }
    if (!failed) {
      steps.push(await checkTrackerLog(admin, clickId));
      steps.push(await checkPublisher(scenario, clickId));
    }
  } catch (err) {
    steps.push({ label: 'Run stopped', outcome: 'fail', detail: err instanceof Error ? err.message : String(err) });
  }

  return {
    id: scenario.id,
    title: scenario.title,
    passed: steps.every((s) => s.outcome === 'pass' || s.outcome === 'skipped'),
    clickId,
    durationMs: Date.now() - started,
    steps,
  };
}

export async function runScenarios(scenarios: Scenario[], admin: TrackerAdmin): Promise<ScenarioResult[]> {
  const fixtures = admin.cachedFixtures ?? (await admin.ensureFixtures());
  const results: ScenarioResult[] = [];
  for (const s of scenarios) results.push(await runScenario(s, admin, fixtures));
  return results;
}
