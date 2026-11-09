import { OfferKind } from '../config';
import { PostbackInput, ProfileId } from '../tracker/profiles';

/** Shared between the steps of one scenario run. */
export interface ScenarioContext {
  clickId: string;
  token: string;
  /** Values remembered by earlier steps, e.g. the first conversion ID. */
  memo: Record<string, unknown>;
}

/** Returns null when the answer is right, otherwise a plain sentence saying what is wrong. */
export type BodyCheck = (body: Record<string, unknown>, ctx: ScenarioContext) => string | null;

export interface PostbackStep {
  kind: 'postback';
  label: string;
  profile: ProfileId;
  /** Values to send. clickId defaults to the scenario's click. */
  input: (ctx: ScenarioContext) => Partial<PostbackInput>;
  expectStatus: number;
  check?: BodyCheck;
}

/** The same postback sent many times at once, like a network that retries in parallel. */
export interface BurstStep {
  kind: 'burst';
  label: string;
  profile: ProfileId;
  count: number;
  input: (ctx: ScenarioContext) => Partial<PostbackInput>;
}

export type Step = PostbackStep | BurstStep;

export interface Scenario {
  id: string;
  title: string;
  description: string;
  offer: OfferKind;
  steps: Step[];
  /** How many postbacks the tracker must send to the publisher for this click (approved conversions only). */
  publisherPostbacks: number;
}

export type Outcome = 'pass' | 'fail' | 'skipped' | 'not-run';

export interface StepResult {
  label: string;
  outcome: Outcome;
  detail: string;
  request?: { method: string; url: string };
  response?: { status: number; body: Record<string, unknown> };
}

export interface ScenarioResult {
  id: string;
  title: string;
  passed: boolean;
  clickId: string | null;
  durationMs: number;
  steps: StepResult[];
}
