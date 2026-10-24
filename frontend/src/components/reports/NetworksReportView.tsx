import { useState, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { fetchNetworksReport } from '../../services/api';
import { NetworkReportResponse } from '../../types';

export function NetworksReportView() {
  const [report, setReport] = useState<NetworkReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState('September 23, 2026 - October 22, 2026');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await fetchNetworksReport();
      setReport(res);
    } catch (err) {
      console.error('Failed to load networks report', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = (report?.data || []).filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.offer.toLowerCase().includes(q) ||
      String(item.id).includes(q)
    );
  });

  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header & Date Range */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Networks Report</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Performance analytics broken down by Advertiser network and campaign offer
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-surface border border-border-subtle hover:border-primary text-xs font-medium text-fg shadow-sm transition"
          >
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-fg-muted" />
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg bg-surface border border-border-subtle shadow-xl z-30 p-2 text-xs divide-y divide-border-subtle">
              <div className="space-y-1 pb-2">
                {[
                  'Today',
                  'Yesterday',
                  'Last 7 Days',
                  'Last 30 Days',
                  'September 23, 2026 - October 22, 2026',
                ].map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => {
                      setDateRange(range);
                      setShowDatePicker(false);
                      loadData();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded hover:bg-surface-elevated text-fg transition"
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report DataTable with Grouped Header */}
      <div className="panel-card p-5 space-y-4">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-fg-muted">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-surface-elevated border border-border-subtle text-fg rounded px-2.5 py-1 text-xs focus:outline-none focus:border-primary"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span>Search:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search Advertiser or Offer..."
              className="w-full sm:w-60 bg-surface-elevated border border-border-subtle text-fg rounded px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Grouped Header Row */}
              <tr className="bg-surface-elevated border-b border-border-subtle text-fg-muted uppercase tracking-wider text-[11px] font-semibold">
                <th rowSpan={2} className="py-2.5 px-3 border-r border-border-subtle text-center w-12">
                  #
                </th>
                <th rowSpan={2} className="py-2.5 px-4 border-r border-border-subtle">
                  Advertiser Name
                </th>
                <th rowSpan={2} className="py-2.5 px-4 border-r border-border-subtle">
                  Offer
                </th>
                <th rowSpan={2} className="py-2.5 px-3 border-r border-border-subtle text-right">
                  Clicks
                </th>
                <th colSpan={3} className="py-2 px-3 border-r border-border-subtle text-center bg-surface-elevated/70">
                  Conversions
                </th>
                <th rowSpan={2} className="py-2.5 px-4 text-right">
                  Payout
                </th>
              </tr>
              <tr className="bg-surface-elevated/90 border-b border-border-subtle text-fg-muted uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-1.5 px-3 border-r border-border-subtle text-right">Approved</th>
                <th className="py-1.5 px-3 border-r border-border-subtle text-right">Unchecked</th>
                <th className="py-1.5 px-3 border-r border-border-subtle text-right font-bold text-fg">
                  Total
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-subtle font-normal text-fg">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={`sk-nr-${i}`} className="animate-pulse">
                    <td colSpan={8} className="py-3 px-4">
                      <div className="h-4 bg-surface-elevated rounded" />
                    </td>
                  </tr>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={`${item.id}-${item.offer}`} className="hover:bg-surface-elevated/40 transition">
                    <td className="py-2.5 px-3 border-r border-border-subtle text-center text-fg-muted">
                      {item.id}
                    </td>
                    <td className="py-2.5 px-4 border-r border-border-subtle font-semibold text-fg">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-4 border-r border-border-subtle text-fg">
                      {item.offer}
                    </td>
                    <td className="py-2.5 px-3 border-r border-border-subtle text-right tabular-nums">
                      {item.clicks}
                    </td>
                    <td className="py-2.5 px-3 border-r border-border-subtle text-right tabular-nums text-emerald-500 font-semibold">
                      {item.conversionsApproved}
                    </td>
                    <td className="py-2.5 px-3 border-r border-border-subtle text-right tabular-nums text-amber-500 font-semibold">
                      {item.conversionsUnchecked}
                    </td>
                    <td className="py-2.5 px-3 border-r border-border-subtle text-right tabular-nums font-bold text-fg">
                      {item.conversionsTotal}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-fg">
                      $ {item.payout.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-fg-muted font-medium">
                    No matching network report records found
                  </td>
                </tr>
              )}
            </tbody>

            {/* Bold Footer Summary Row [07:48] */}
            {report?.summary && (
              <tfoot className="bg-surface-elevated/80 border-t-2 border-border-subtle font-bold text-fg text-xs">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-left border-r border-border-subtle uppercase tracking-wider text-[11px]">
                    Total / Summary
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums border-r border-border-subtle">
                    {report.summary.totalClicks}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums border-r border-border-subtle text-emerald-500">
                    {report.summary.totalApproved}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums border-r border-border-subtle text-amber-500">
                    {report.summary.totalUnchecked}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums border-r border-border-subtle text-fg">
                    {report.summary.totalConversions}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-primary text-sm">
                    $ {report.summary.totalPayout.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-fg-muted pt-1">
          <div>
            Showing {totalEntries === 0 ? 0 : startIndex + 1} to {endIndex} of {totalEntries} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1.5 rounded border border-border-subtle bg-surface hover:bg-surface-elevated text-fg disabled:opacity-40 transition"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-fg font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages || isLoading}
              className="px-3 py-1.5 rounded border border-border-subtle bg-surface hover:bg-surface-elevated text-fg disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
