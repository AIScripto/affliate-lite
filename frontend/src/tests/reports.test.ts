/**
 * Reports Hub & Export Utility Test Suite
 * Conforming to DOD Rule 7 (Always Write Test Cases covering positive flows, edge cases, and error recovery)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildReportPrintHtml,
  ReportDocument,
} from '../utils/exportUtils';

describe('Reports Module & Export Utilities Test Suite', () => {
  const sampleDocument: ReportDocument = {
    title: 'Affiliate Conversions Detailed Report',
    subtitle: 'Filter: 2026-10-01 to 2026-10-31 · 2 Records',
    fileName: 'Affiliate-Conversions-Test',
    summary: [
      { label: 'Total Clicks', value: '1,500' },
      { label: 'Total Conversions', value: '45' },
      { label: 'Gross Revenue', value: '$ 6,750.00' },
      { label: 'Total Payout', value: '$ 4,500.00' },
    ],
    columns: [
      { label: 'Date', kind: 'date' },
      { label: 'Document Number', kind: 'text' },
      { label: 'Offer', kind: 'text' },
      { label: 'Network', kind: 'text' },
      { label: 'Publisher', kind: 'text' },
      { label: 'Status', kind: 'text' },
      { label: 'Gross', kind: 'money' },
      { label: 'Payout', kind: 'money' },
    ],
    rows: [
      {
        cells: ['2026-10-20', 'CNV-000010', 'Luovia - OA', 'MaxWave Global', 'Layaris Keto', 'APPROVED', 150.0, 100.0],
      },
      {
        cells: ['2026-10-21', 'CNV-000011', 'Bio Health Pro', 'AffiliateX', 'Traffic Pulse', 'UNCHECKED', 200.0, 140.0],
      },
      {
        style: 'total',
        cells: ['Totals For All 2 Records', '', '', '', '', '', 350.0, 240.0],
      },
    ],
  };

  it('positive flow: buildReportPrintHtml generates valid, styled HTML document', () => {
    const html = buildReportPrintHtml(sampleDocument);
    assert.ok(html.includes('<!doctype html>'));
    assert.ok(html.includes('Oval Media — Affiliate Tracking System'));
    assert.ok(html.includes('Affiliate Conversions Detailed Report'));
    assert.ok(html.includes('CNV-000010'));
    assert.ok(html.includes('Totals For All 2 Records'));
    assert.ok(html.includes('$ 350.00'));
    assert.ok(html.includes('$ 240.00'));
  });

  it('positive flow: summary cards are rendered with exact metrics', () => {
    const html = buildReportPrintHtml(sampleDocument);
    assert.ok(html.includes('Gross Revenue'));
    assert.ok(html.includes('$ 6,750.00'));
    assert.ok(html.includes('Total Payout'));
    assert.ok(html.includes('$ 4,500.00'));
  });

  it('edge case: empty rows generate clean empty state message', () => {
    const emptyDoc: ReportDocument = {
      title: 'Empty Report',
      fileName: 'empty-test',
      columns: [{ label: 'ID', kind: 'text' }, { label: 'Name', kind: 'text' }],
      rows: [],
    };
    const html = buildReportPrintHtml(emptyDoc);
    assert.ok(html.includes('No records found for the selected filters.'));
  });

  it('edge case: null and undefined cell values are safely formatted', () => {
    const nullDoc: ReportDocument = {
      title: 'Null Cells Test',
      fileName: 'null-test',
      columns: [{ label: 'Amount', kind: 'money' }, { label: 'Text', kind: 'text' }],
      rows: [
        { cells: [null, undefined] },
      ],
    };
    const html = buildReportPrintHtml(nullDoc);
    assert.ok(html.includes('<td>-</td>'));
  });

  it('error recovery: handles special HTML characters safely against XSS', () => {
    const xssDoc: ReportDocument = {
      title: 'Test <script>alert("xss")</script>',
      fileName: 'xss-test',
      columns: [{ label: 'Description & Notes', kind: 'text' }],
      rows: [
        { cells: ['<img src=x onerror=alert(1)>'] },
      ],
    };
    const html = buildReportPrintHtml(xssDoc);
    assert.ok(!html.includes('<script>alert'));
    assert.ok(html.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'));
    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  });
});

