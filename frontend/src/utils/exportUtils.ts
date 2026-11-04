/**
 * Report Document & Export Utilities
 * Provides browser printing (with Save-to-PDF support) and Excel-compatible CSV export.
 */

export type ReportColumnKind = 'text' | 'money' | 'quantity' | 'date' | 'percent';

export interface ReportColumn {
  label: string;
  key?: string;
  kind?: ReportColumnKind;
}

export interface ReportRow {
  cells: Array<string | number | null | undefined>;
  style?: 'normal' | 'group' | 'total';
}

export interface ReportSummaryStat {
  label: string;
  value: string;
}

export interface ReportDocument {
  title: string;
  subtitle?: string;
  summary?: ReportSummaryStat[];
  columns: ReportColumn[];
  rows: ReportRow[];
  note?: string;
  fileName: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCell(val: string | number | null | undefined, kind?: ReportColumnKind): string {
  if (val === null || val === undefined || val === '') return '-';
  if (kind === 'money') {
    const num = Number(val);
    return isNaN(num) ? String(val) : `$ ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (kind === 'percent') {
    const num = Number(val);
    return isNaN(num) ? String(val) : `${num.toFixed(2)}%`;
  }
  if (kind === 'quantity') {
    const num = Number(val);
    return isNaN(num) ? String(val) : num.toLocaleString('en-US');
  }
  if (kind === 'date') {
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    } catch {
      // Fallback to string
    }
  }
  return String(val);
}

export function buildReportPrintHtml(report: ReportDocument): string {
  const companyName = 'Oval Media — Affiliate Tracking System';
  const isNumeric = (col: ReportColumn) => col.kind === 'money' || col.kind === 'quantity' || col.kind === 'percent';

  const thead = report.columns
    .map(col => `<th class="${isNumeric(col) ? 'num' : ''}">${escapeHtml(col.label)}</th>`)
    .join('');

  const tbody = report.rows.length
    ? report.rows.map(row => {
        const rowClass = row.style || 'normal';
        const cellsHtml = row.cells.map((cell, idx) => {
          const col = report.columns[idx];
          return `<td class="${col && isNumeric(col) ? 'num' : ''}">${escapeHtml(formatCell(cell, col?.kind))}</td>`;
        }).join('');
        return `<tr class="${rowClass}">${cellsHtml}</tr>`;
      }).join('')
    : `<tr><td colspan="${report.columns.length}" class="empty">No records found for the selected filters.</td></tr>`;

  const summaryHtml = report.summary && report.summary.length > 0
    ? `<div class="summary-grid">${report.summary.map(s => `
        <div class="summary-card">
          <div class="summary-label">${escapeHtml(s.label)}</div>
          <div class="summary-val">${escapeHtml(s.value)}</div>
        </div>
      `).join('')}</div>`
    : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    @page {
      size: A4 ${report.columns.length > 6 ? 'landscape' : 'portrait'};
      margin: 12mm;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #1e293b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .company {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .report-title {
      font-size: 15px;
      font-weight: 700;
      color: #334155;
      text-align: right;
    }
    .report-meta {
      font-size: 10px;
      color: #64748b;
      margin-top: 3px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 8px;
      margin-bottom: 16px;
    }
    .summary-card {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 6px 10px;
      background: #f8fafc;
    }
    .summary-label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }
    .summary-val {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
      font-variant-numeric: tabular-nums;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    thead {
      display: table-header-group;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      text-align: left;
      padding: 6px 8px;
      font-size: 10px;
      font-weight: 700;
      border: 1px solid #0f172a;
      letter-spacing: 0.02em;
    }
    td {
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: middle;
      font-size: 10.5px;
    }
    tr.total td {
      background: #f1f5f9;
      font-weight: 800;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
    }
    tr:nth-child(even):not(.total) td {
      background: #fafafa;
    }
    .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .empty {
      text-align: center;
      color: #94a3b8;
      padding: 24px;
      font-style: italic;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      color: #94a3b8;
      font-size: 9px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">${escapeHtml(companyName)}</div>
      <div class="report-meta">Automated Affiliate Marketing & Attribution Platform</div>
      <div class="report-meta">Official Live Ledger Audit</div>
    </div>
    <div>
      <div class="report-title">${escapeHtml(report.title)}</div>
      <div class="report-meta" style="text-align: right;">${escapeHtml(report.subtitle || 'All Records')}</div>
      <div class="report-meta" style="text-align: right;">Generated: ${new Date().toLocaleString('en-US')}</div>
    </div>
  </div>
  ${summaryHtml}
  <table>
    <thead>
      <tr>${thead}</tr>
    </thead>
    <tbody>
      ${tbody}
    </tbody>
  </table>
  <div class="footer">
    <div>Direct PostgreSQL Database Ledger · Real-Time Certified</div>
    <div>System Generated Report</div>
  </div>
</body>
</html>`;
}

/**
 * Triggers browser printing (also supports Save to PDF via system print preview).
 */
export function printReport(report: ReportDocument): void {
  const frame = document.createElement('iframe');
  Object.assign(frame.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
  });
  frame.setAttribute('aria-hidden', 'true');
  document.body.appendChild(frame);

  const printDoc = frame.contentWindow?.document;
  if (!printDoc || !frame.contentWindow) {
    frame.remove();
    throw new Error('Unable to initialize printing frame. Please try again.');
  }

  printDoc.open();
  printDoc.write(buildReportPrintHtml(report));
  printDoc.close();

  window.setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => frame.remove(), 1000);
  }, 250);
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  // Prevent CSV formula injection in spreadsheet applications
  const safe = /^[=+@\-]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * Exports data into a clean UTF-8 CSV with Byte Order Mark (BOM) for seamless opening in Excel.
 */
export function exportToExcel(report: ReportDocument): void {
  const lines: string[][] = [
    [report.title],
    ...(report.subtitle ? [[report.subtitle]] : []),
    [`Generated at: ${new Date().toISOString()}`],
    [],
    report.columns.map(c => c.label),
    ...report.rows.map(r => r.cells.map(c => (c !== null && c !== undefined ? String(c) : ''))),
  ];

  const csvContent = lines.map(line => line.map(escapeCsvCell).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = report.fileName.replace(/[^a-zA-Z0-9-_]/g, '-');
  link.download = `${safeName}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
