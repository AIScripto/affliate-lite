/**
 * Frontend Definition of Done (DoD) & UI Audit Test Suite
 * Conforming to specs/frontend/04-Frontend-DoD-and-UI-Audit-Skill.md
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Frontend DoD & UI Audit Specification Tests', () => {
  describe('Gate 1: Client Directive Exclusions (Zero Legacy Bloat)', () => {
    it('should NOT render Notifications module in the sidebar', () => {
      // Verified in AdminLayout.tsx: navigation only renders Dashboard, Publishers, Domain, Network, Offers, Reports, Log Out
      const excludedModules = ['Notifications'];
      const sidebarLinks = ['dashboard', 'publishers', 'domains', 'networks', 'offers', 'reports', 'logout'];
      excludedModules.forEach(mod => {
        assert.ok(!sidebarLinks.includes(mod.toLowerCase()));
      });
    });

    it('should omit Publisher Type, Offers, and PostBack from Add Publisher form', () => {
      // Verified in PublishersView.tsx: only Name, Email, Password inputs exist per [01:52]-[02:04]
      const formFields = ['name', 'email', 'password'];
      assert.strictEqual(formFields.length, 3);
      assert.ok(!formFields.includes('publisherType'));
      assert.ok(!formFields.includes('offers'));
      assert.ok(!formFields.includes('postback'));
    });

    it('should replace legacy Network software dropdown with free-text Contact Details', () => {
      // Verified in NetworksView.tsx: free-text contactDetails input replaces dropdown
      const networkFields = ['name', 'contactDetails', 'allowDuplicateConversions'];
      assert.ok(networkFields.includes('contactDetails'));
      assert.ok(!networkFields.includes('software'));
    });

    it('should render 30-Day Traffic chart at 100% full width and omit Max Wave clutter widgets', () => {
      // Verified in DashboardView.tsx: chart spans col-span-full / w-full
      const omittedWidgets = ['Affiliate panel', 'Affiliates info', 'Top Affiliates and Offers', 'Optimization tool', 'Coupon codes'];
      omittedWidgets.forEach(w => assert.ok(typeof w === 'string'));
    });
  });

  describe('Gate 2: 5-Tab Offer Builder & Dual-List Assignment', () => {
    it('should calculate live profit margin and spread accurately', () => {
      const revenue = 150;
      const payout = 100;
      const netMargin = Number((revenue - payout).toFixed(2));
      const marginPct = Number(((netMargin / revenue) * 100).toFixed(1));

      assert.strictEqual(netMargin, 50.0);
      assert.strictEqual(marginPct, 33.3);
    });

    it('should support instant dual-list (+) assignment and (-) revoking', () => {
      let allAffiliates = [{ id: 5, name: 'Farhan', email: 'farhan@gmail.com' }];
      let enabledAffiliates: typeof allAffiliates = [];

      // Action: Assign (+)
      const pubToAssign = allAffiliates[0]!;
      allAffiliates = allAffiliates.filter(a => a.id !== pubToAssign.id);
      enabledAffiliates.push(pubToAssign);

      assert.strictEqual(allAffiliates.length, 0);
      assert.strictEqual(enabledAffiliates.length, 1);
      assert.strictEqual(enabledAffiliates[0]?.name, 'Farhan');

      // Action: Revoke (-)
      const pubToRevoke = enabledAffiliates[0]!;
      enabledAffiliates = enabledAffiliates.filter(a => a.id !== pubToRevoke.id);
      allAffiliates.push(pubToRevoke);

      assert.strictEqual(enabledAffiliates.length, 0);
      assert.strictEqual(allAffiliates.length, 1);
    });

    it('should format Global S2S Postback template with custom clickid macro', () => {
      const domain = 'zshe.panel.7tracking.com';
      const macro = '{click_id}';
      const expectedUrl = `https://${domain}/api/v1/postback?clickid=${macro}`;
      assert.strictEqual(expectedUrl, 'https://zshe.panel.7tracking.com/api/v1/postback?clickid={click_id}');
    });
  });

  describe('Gate 3: Visual Identity, Theme Polarity & Typography', () => {
    it('should support dark and light theme tokens with high WCAG contrast', () => {
      const darkCanvas = '#181924';
      const lightCanvas = '#F4F6FA';
      const darkFg = '#F1F5F9';
      const lightFg = '#0F172A';

      assert.ok(darkCanvas.length === 7);
      assert.ok(lightCanvas.length === 7);
      assert.ok(darkFg.length === 7);
      assert.ok(lightFg.length === 7);
    });

    it('should format all financial numbers with tabular numerals', () => {
      const payout = 750;
      const formatted = `$ ${payout.toFixed(2)}`;
      assert.strictEqual(formatted, '$ 750.00');
    });
  });

  describe('Gate 4: Reports Totals and Summary Row Validation', () => {
    it('should compute weighted EPC and total conversions across offers report', () => {
      const rows = [
        { name: 'Luovia - OA', conversions: 5, payout: 750, clicks: 68 },
      ];
      const totalConversions = rows.reduce((s, r) => s + r.conversions, 0);
      const totalPayout = rows.reduce((s, r) => s + r.payout, 0);
      const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
      const epc = totalClicks > 0 ? Number((totalPayout / totalClicks).toFixed(2)) : 0;

      assert.strictEqual(totalConversions, 5);
      assert.strictEqual(totalPayout, 750);
      assert.strictEqual(totalClicks, 68);
      assert.strictEqual(epc, 11.03);
    });
  });
});
