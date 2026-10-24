import { useState, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { fetchOffersReport } from '../../services/api';
import { OfferReportResponse } from '../../types';

export function OffersReportView() {
  const [report, setReport] = useState<OfferReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState('October 1, 2026 - October 22, 2026');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await fetchOffersReport();
      setReport(res);
    } catch (err) {
      console.error('Failed to load offers report', err);
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
    return item.name.toLowerCase().includes(q) || String(item.id).includes(q);
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
          <h1 className="text-xl font-bold tracking-tight text-fg">Offers Report</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Aggregated conversion rates, clicks, payouts, and EPC across active offers
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
                  'October 1, 2026 - October 22, 2026',
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

      {/* Report DataTable */}
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
              placeholder="Search Offer name or ID..."
              className="w-full sm:w-60 bg-surface-elevated border border-border-subtle text-fg rounded px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-elevated border-b border-border-subtle text-fg-muted uppercase tracking-wider text-[11px] font-semibold">
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4 text-right">Conversions</th>
                <th className="py-3 px-4 text-right">Payout</th>
                <th className="py-3 px-4 text-right">Clicks</th>
                <th className="py-3 px-4 text-right">EPC</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-subtle font-normal text-fg">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={`sk-or-${i}`} className="animate-pulse">
                    <td colSpan={6} className="py-3 px-4">
                      <div className="h-4 bg-surface-elevated rounded" />
                    </td>
                  </tr>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-elevated/40 transition">
                    <td className="py-2.5 px-3 text-center text-fg-muted">{item.id}</td>
                    <td className="py-2.5 px-4 font-semibold text-fg">{item.name}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-emerald-500">
                      {item.conversions ?? 0}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-fg">
                      $ {Number(item.payout ?? 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-fg">{item.clicks ?? 0}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold text-primary">
                      $ {Number(item.epc ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-fg-muted font-medium">
                    No matching offers report records found
                  </td>
                </tr>
              )}
            </tbody>

            {/* Bold Footer Summary Row [08:05] */}
            {report?.summary && (
              <tfoot className="bg-surface-elevated/80 border-t-2 border-border-subtle font-bold text-fg text-xs">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-left uppercase tracking-wider text-[11px]">
                    Total / Summary
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-emerald-500">
                    {report.summary.totalConversions ?? 0}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-fg">
                    $ {Number(report.summary.totalPayout ?? 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-fg">
                    {report.summary.totalClicks ?? 0}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-primary text-sm">
                    $ {Number(report.summary.weightedEpc ?? (report.summary as any).averageEpc ?? 0).toFixed(2)}
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
