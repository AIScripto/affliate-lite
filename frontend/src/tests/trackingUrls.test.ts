/**
 * Tracking link builder tests (postback and pixel links given to networks).
 * DOD Rule 7: positive flows, edge cases, and error recovery.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildTrackingUrl } from '../utils/trackingUrls';
import { TRACKING_PATHS } from '../constants/offers';

const VM = 'http://161.97.110.121:3085';

describe('buildTrackingUrl', () => {
  it('positive: postback link with the click macro', () => {
    assert.equal(buildTrackingUrl('postback', ['clickid={clickid}'], VM), `${VM}/api/v1/postback?clickid={clickid}`);
  });

  it('positive: pixels get exactly one "?" (old builder produced "?offer_id=7?clickid=...")', () => {
    const parts = ['clickid={clickid}', 'goal=1', 'secure_token=abc'];
    for (const key of ['pixelImage', 'pixelFrame', 'pixelScript'] as const) {
      const url = buildTrackingUrl(key, parts, VM);
      assert.equal(url.split('?').length, 2, url);
      assert.ok(url.startsWith(`${VM}${TRACKING_PATHS[key]}?clickid={clickid}&goal=1`), url);
      assert.ok(!url.includes('offer_id'), 'no hardcoded offer id');
    }
  });

  it('edge: no query parts gives a bare path; empty parts are skipped', () => {
    assert.equal(buildTrackingUrl('postback', [], VM), `${VM}/api/v1/postback`);
    assert.equal(buildTrackingUrl('postback', ['', 'goal=1'], VM), `${VM}/api/v1/postback?goal=1`);
  });

  it('rule: links never point at the old third-party tracking domain', () => {
    assert.ok(!buildTrackingUrl('postback', [], VM).includes('7tracking.com'));
  });
});
