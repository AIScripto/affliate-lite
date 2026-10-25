import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  defaultPageSize?: number;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  footerRow?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No matching records found',
  defaultPageSize = 10,
  searchPlaceholder = 'Search...',
  searchFilter,
  footerRow,
}: DataTableProps<T>) {
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Ensure data is always an array regardless of backend payload wrapping
  const safeData: T[] = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const anyData = data as any;
      if (Array.isArray(anyData.data)) return anyData.data;
      if (Array.isArray(anyData.publishers)) return anyData.publishers;
      if (Array.isArray(anyData.domains)) return anyData.domains;
      if (Array.isArray(anyData.networks)) return anyData.networks;
      if (Array.isArray(anyData.offers)) return anyData.offers;
    }
    return [];
  }, [data]);

  // Filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return safeData;
    const query = searchQuery.toLowerCase();
    if (searchFilter) {
      return safeData.filter((item) => searchFilter(item, query));
    }
    return safeData.filter((item) => {
      return Object.values(item as Record<string, any>).some((val) =>
        String(val ?? '')
          .toLowerCase()
          .includes(query)
      );
    });
  }, [safeData, searchQuery, searchFilter]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination
  const totalEntries = sortedData.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable === false) return;
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className="w-full flex flex-col gap-3.5">
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
            className="bg-surface-elevated border border-border-subtle text-fg rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-primary transition shadow-xs cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>entries</span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg pl-8.5 pr-8 py-1.5 text-xs placeholder:text-fg-muted/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg p-0.5"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="panel-card overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface-elevated/80 border-b border-border-subtle text-fg-muted uppercase tracking-wider text-[11px] font-semibold">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const isSortable = col.sortable !== false;
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    onClick={() => handleSort(col.key, col.sortable)}
                    className={`py-3 px-4 bg-surface-elevated text-black dark:text-white font-bold select-none ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    } ${isSortable ? 'cursor-pointer select-none hover:text-fg' : ''}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'center'
                          ? 'justify-center'
                          : col.align === 'right'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <span>{col.header}</span>
                      {isSortable && (
                        <span className="text-fg-muted/60">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-primary" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle font-normal text-fg">
            {isLoading ? (
              // CLS = 0 Skeleton Rows
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  {columns.map((_, idx) => (
                    <td key={`sk-${idx}`} className="py-3.5 px-4">
                      <div className="h-4 bg-surface-elevated rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <tr
                  key={keyExtractor(item, startIndex + index)}
                  className="hover:bg-surface-elevated/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 px-4 ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right tabular-nums'
                          : 'text-left'
                      }`}
                    >
                      {col.render ? col.render(item, startIndex + index) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-fg-muted font-medium"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
          {footerRow && <tfoot>{footerRow}</tfoot>}
        </table>
      </div>

      {/* Bottom Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-fg-muted pt-1">
        <div>
          Showing {totalEntries === 0 ? 0 : startIndex + 1} to {endIndex} of {totalEntries} entries
          {totalEntries !== data.length && ` (filtered from ${data.length} total)`}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage <= 1 || isLoading}
            className="btn-3d-subtle px-3 py-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-elevated text-fg font-medium disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((page, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev && page - prev > 1;
              return (
                <React.Fragment key={page}>
                  {showEllipsis && <span className="px-1 text-fg-muted font-bold">...</span>}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-8 py-1.5 px-2.5 rounded-lg text-center transition cursor-pointer text-xs ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-primary via-indigo-600 to-indigo-700 text-white font-bold shadow-md shadow-primary/25 border-t border-white/20'
                        : 'btn-3d-subtle bg-surface border border-border-subtle hover:bg-surface-elevated text-fg font-medium'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages || isLoading}
            className="btn-3d-subtle px-3 py-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-elevated text-fg font-medium disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
