import { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart3,
  Tag,
  Network as NetworkIcon,
  Users,
  Target,
  Zap,
  Printer,
  Download,
  RefreshCw,
  Info,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  MousePointer,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import {
  fetchReportsOverview,
  fetchOffersReport,
  fetchNetworksReport,
  fetchPublishersReport,
  fetchConversionsReport,
  fetchTrafficReport,
  fetchNetworks,
  fetchPublishers,
  fetchOffers
} from '../../services/api';
import {
  ReportsOverviewResponse,
  OfferReportResponse,
  NetworkReportResponse,
  PublisherReportResponse,
  ConversionReportResponse,
  TrafficReportResponse,
  Network,
  User,
  Offer
} from '../../types';
import { printReport, exportToExcel, ReportDocument } from '../../utils/exportUtils';

export type ReportTabKey = 'overview' | 'offers' | 'networks' | 'publishers' | 'conversions' | 'traffic';

interface ReportsViewProps {
  initialTab?: ReportTabKey;
}

export function ReportsView({ initialTab = 'overview' }: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<ReportTabKey>(initialTab);
  const [subTab, setSubTab] = useState<'summary' | 'details'>('summary');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState('');
  const [selectedOffer, setSelectedOffer] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Support Entities
  const [networksList, setNetworksList] = useState<Network[]>([]);
  const [publishersList, setPublishersList] = useState<User[]>([]);
  const [offersList, setOffersList] = useState<Offer[]>([]);

  // Data States
  const [overviewData, setOverviewData] = useState<ReportsOverviewResponse | null>(null);
  const [offersData, setOffersData] = useState<OfferReportResponse | null>(null);
  const [networksData, setNetworksData] = useState<NetworkReportResponse | null>(null);
  const [publishersData, setPublishersData] = useState<PublisherReportResponse | null>(null);
  const [conversionsData, setConversionsData] = useState<ConversionReportResponse | null>(null);
  const [trafficData, setTrafficData] = useState<TrafficReportResponse | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  // Sync initialTab when props change
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setCurrentPage(1);
    }
  }, [initialTab]);

  // Load support entity lists once
  useEffect(() => {
    let isMounted = true;
    async function loadSupportData() {
      try {
        const [nets, pubs, offs] = await Promise.all([
          fetchNetworks().catch(() => []),
          fetchPublishers().catch(() => []),
          fetchOffers().catch(() => []),
        ]);
        if (isMounted) {
          setNetworksList(nets);
          setPublishersList(pubs);
          setOffersList(offs);
        }
      } catch (err) {
        console.error('Failed to load support filter lists', err);
      }
    }
    loadSupportData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close export menu on click outside
  useEffect(() => {
    if (!showExportMenu) return;
    function handleClickOutside(event: MouseEvent) {
      if (!exportMenuRef.current?.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  // Main data loader based on active tab and filters
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'overview') {
        const res = await fetchReportsOverview(dateFrom || undefined, dateTo || undefined);
        setOverviewData(res);
      } else if (activeTab === 'offers') {
        const res = await fetchOffersReport(dateFrom || undefined, dateTo || undefined, search || undefined);
        setOffersData(res);
      } else if (activeTab === 'networks') {
        const res = await fetchNetworksReport(dateFrom || undefined, dateTo || undefined, search || undefined);
        setNetworksData(res);
      } else if (activeTab === 'publishers') {
        const res = await fetchPublishersReport(dateFrom || undefined, dateTo || undefined, search || undefined);
        setPublishersData(res);
      } else if (activeTab === 'conversions') {
        const res = await fetchConversionsReport({
          search: search || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          networkId: selectedNetwork ? Number(selectedNetwork) : undefined,
          publisherId: selectedPublisher ? Number(selectedPublisher) : undefined,
          offerId: selectedOffer ? Number(selectedOffer) : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          minAmount: amountFrom ? Number(amountFrom) : undefined,
          maxAmount: amountTo ? Number(amountTo) : undefined,
        });
        setConversionsData(res);
      } else if (activeTab === 'traffic') {
        const res = await fetchTrafficReport({
          search: search || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          publisherId: selectedPublisher ? Number(selectedPublisher) : undefined,
          offerId: selectedOffer ? Number(selectedOffer) : undefined,
        });
        setTrafficData(res);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch report data from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    activeTab,
    selectedNetwork,
    selectedPublisher,
    selectedOffer,
    selectedStatus,
    dateFrom,
    dateTo,
    amountFrom,
    amountTo,
  ]);

  // Filtered rows for current active tab
  const tabRows = useMemo(() => {
    if (activeTab === 'offers') {
      let rows = offersData?.data || [];
      if (selectedNetwork) {
        const netObj = networksList.find((n) => String(n.id) === selectedNetwork);
        if (netObj) {
          rows = rows.filter((r) => r.networkName === netObj.name);
        }
      }
      if (amountFrom) {
        rows = rows.filter((r) => r.payout >= Number(amountFrom));
      }
      if (amountTo) {
        rows = rows.filter((r) => r.payout <= Number(amountTo));
      }
      return rows;
    }
    if (activeTab === 'networks') {
      let rows = networksData?.data || [];
      if (amountFrom) {
        rows = rows.filter((r) => r.payout >= Number(amountFrom));
      }
      if (amountTo) {
        rows = rows.filter((r) => r.payout <= Number(amountTo));
      }
      return rows;
    }
    if (activeTab === 'publishers') {
      let rows = publishersData?.data || [];
      if (selectedOffer) {
        const offObj = offersList.find((o) => String(o.id) === selectedOffer);
        if (offObj) {
          rows = rows.filter((r) => r.offer === offObj.name);
        }
      }
      if (amountFrom) {
        rows = rows.filter((r) => r.payout >= Number(amountFrom));
      }
      if (amountTo) {
        rows = rows.filter((r) => r.payout <= Number(amountTo));
      }
      return rows;
    }
    if (activeTab === 'conversions') {
      return conversionsData?.data || [];
    }
    if (activeTab === 'traffic') {
      return trafficData?.data || [];
    }
    return [];
  }, [
    activeTab,
    offersData,
    networksData,
    publishersData,
    conversionsData,
    trafficData,
    selectedNetwork,
    selectedOffer,
    amountFrom,
    amountTo,
    networksList,
    offersList,
  ]);

  // Paginated rows for the active table
  const totalRecords = tabRows.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return tabRows.slice(start, start + pageSize);
  }, [tabRows, currentPage, pageSize]);

  // Summary Totals calculated directly from filtered rows
  const tableTotals = useMemo(() => {
    if (activeTab === 'offers') {
      const clicks = tabRows.reduce((acc, r: any) => acc + (r.clicks || 0), 0);
      const conversions = tabRows.reduce((acc, r: any) => acc + (r.conversions || 0), 0);
      const payout = tabRows.reduce((acc, r: any) => acc + (r.payout || 0), 0);
      const revenue = tabRows.reduce((acc, r: any) => acc + (r.revenue || 0), 0);
      return { clicks, conversions, payout, revenue };
    }
    if (activeTab === 'networks') {
      const clicks = tabRows.reduce((acc, r: any) => acc + (r.clicks || 0), 0);
      const approved = tabRows.reduce((acc, r: any) => acc + (r.conversionsApproved || 0), 0);
      const unchecked = tabRows.reduce((acc, r: any) => acc + (r.conversionsUnchecked || 0), 0);
      const totalConv = tabRows.reduce((acc, r: any) => acc + (r.conversionsTotal || 0), 0);
      const payout = tabRows.reduce((acc, r: any) => acc + (r.payout || 0), 0);
      const revenue = tabRows.reduce((acc, r: any) => acc + (r.revenue || 0), 0);
      return { clicks, approved, unchecked, totalConv, payout, revenue };
    }
    if (activeTab === 'publishers') {
      const clicks = tabRows.reduce((acc, r: any) => acc + (r.clicks || 0), 0);
      const approved = tabRows.reduce((acc, r: any) => acc + (r.conversionsApproved || 0), 0);
      const unchecked = tabRows.reduce((acc, r: any) => acc + (r.conversionsUnchecked || 0), 0);
      const totalConv = tabRows.reduce((acc, r: any) => acc + (r.conversionsTotal || 0), 0);
      const payout = tabRows.reduce((acc, r: any) => acc + (r.payout || 0), 0);
      return { clicks, approved, unchecked, totalConv, payout };
    }
    if (activeTab === 'conversions') {
      const payout = tabRows.reduce((acc, r: any) => acc + (r.payout || 0), 0);
      const revenue = tabRows.reduce((acc, r: any) => acc + (r.revenue || 0), 0);
      return { payout, revenue };
    }
    if (activeTab === 'traffic') {
      const payout = tabRows.reduce((acc, r: any) => acc + (r.payout || 0), 0);
      const revenue = tabRows.reduce((acc, r: any) => acc + (r.revenue || 0), 0);
      return { payout, revenue };
    }
    return {};
  }, [activeTab, tabRows]);

  // Construct ReportDocument for Print & Export
  const buildReportDocument = (): ReportDocument => {
    const subtitle = `Filter: ${dateFrom || 'All time'} ${dateTo ? 'to ' + dateTo : ''} · ${totalRecords} Records`;

    if (activeTab === 'overview') {
      const sum = overviewData?.summary;
      return {
        title: 'Executive Affiliate Performance Overview',
        subtitle: `Generated: ${new Date().toLocaleDateString()}`,
        fileName: 'Affiliate-Overview-Report',
        summary: [
          { label: 'Total Clicks', value: String(sum?.totalClicks || 0) },
          { label: 'Total Conversions', value: String(sum?.totalConversions || 0) },
          { label: 'Gross Revenue', value: `$ ${(sum?.totalRevenue || 0).toFixed(2)}` },
          { label: 'Total Payout', value: `$ ${(sum?.totalPayout || 0).toFixed(2)}` },
          { label: 'Net Margin', value: `$ ${(sum?.netMargin || 0).toFixed(2)} (${sum?.marginPercent || 0}%)` },
          { label: 'Overall CR', value: `${(sum?.overallCr || 0).toFixed(2)}%` },
        ],
        columns: [
          { label: 'Rank', kind: 'quantity' },
          { label: 'Top Offer', kind: 'text' },
          { label: 'Network', kind: 'text' },
          { label: 'Clicks', kind: 'quantity' },
          { label: 'Conversions', kind: 'quantity' },
          { label: 'CR %', kind: 'percent' },
          { label: 'EPC', kind: 'money' },
          { label: 'Payout', kind: 'money' },
          { label: 'Revenue', kind: 'money' },
        ],
        rows: (overviewData?.topOffers || []).map((o, idx) => ({
          cells: [idx + 1, o.name, o.networkName, o.clicks, o.conversions, o.cr, o.epc, o.payout, o.revenue],
        })),
      };
    }

    if (activeTab === 'offers') {
      return {
        title: 'Offers Performance Report',
        subtitle,
        fileName: 'Affiliate-Offers-Report',
        columns: [
          { label: 'Document Number', kind: 'text' },
          { label: 'Offer Name', kind: 'text' },
          { label: 'Network', kind: 'text' },
          { label: 'Clicks', kind: 'quantity' },
          { label: 'Conversions', kind: 'quantity' },
          { label: 'CR %', kind: 'percent' },
          { label: 'EPC', kind: 'money' },
          { label: 'Payout', kind: 'money' },
          { label: 'Revenue', kind: 'money' },
        ],
        rows: [
          ...tabRows.map((r: any) => ({
            cells: [
              r.documentNumber || `OFR-${String(r.id).padStart(4, '0')}`,
              r.name,
              r.networkName,
              r.clicks,
              r.conversions,
              r.cr || (r.clicks > 0 ? (r.conversions / r.clicks) * 100 : 0),
              r.epc,
              r.payout,
              r.revenue,
            ],
          })),
          {
            style: 'total',
            cells: [
              `Totals For All ${totalRecords} Records`,
              '',
              '',
              tableTotals.clicks || 0,
              tableTotals.conversions || 0,
              '',
              '',
              tableTotals.payout || 0,
              tableTotals.revenue || 0,
            ],
          },
        ],
      };
    }

    if (activeTab === 'networks') {
      return {
        title: 'Networks Performance Report',
        subtitle,
        fileName: 'Affiliate-Networks-Report',
        columns: [
          { label: 'Document Number', kind: 'text' },
          { label: 'Network Name', kind: 'text' },
          { label: 'Associated Offer', kind: 'text' },
          { label: 'Clicks', kind: 'quantity' },
          { label: 'Approved', kind: 'quantity' },
          { label: 'Unchecked', kind: 'quantity' },
          { label: 'Total Conv', kind: 'quantity' },
          { label: 'Payout', kind: 'money' },
          { label: 'Revenue', kind: 'money' },
        ],
        rows: [
          ...tabRows.map((r: any) => ({
            cells: [
              r.documentNumber || `NET-${String(r.id).padStart(4, '0')}`,
              r.name,
              r.offer,
              r.clicks,
              r.conversionsApproved,
              r.conversionsUnchecked,
              r.conversionsTotal,
              r.payout,
              r.revenue,
            ],
          })),
          {
            style: 'total',
            cells: [
              `Totals For All ${totalRecords} Records`,
              '',
              '',
              tableTotals.clicks || 0,
              tableTotals.approved || 0,
              tableTotals.unchecked || 0,
              tableTotals.totalConv || 0,
              tableTotals.payout || 0,
              tableTotals.revenue || 0,
            ],
          },
        ],
      };
    }

    if (activeTab === 'publishers') {
      return {
        title: 'Publishers Performance Report',
        subtitle,
        fileName: 'Affiliate-Publishers-Report',
        columns: [
          { label: 'Document Number', kind: 'text' },
          { label: 'Publisher Name', kind: 'text' },
          { label: 'Assigned Offer', kind: 'text' },
          { label: 'Clicks', kind: 'quantity' },
          { label: 'Approved', kind: 'quantity' },
          { label: 'Unchecked', kind: 'quantity' },
          { label: 'Total Conv', kind: 'quantity' },
          { label: 'EPC', kind: 'money' },
          { label: 'Payout', kind: 'money' },
        ],
        rows: [
          ...tabRows.map((r: any) => ({
            cells: [
              r.documentNumber || `PUB-${String(r.id).padStart(4, '0')}`,
              r.name,
              r.offer,
              r.clicks,
              r.conversionsApproved,
              r.conversionsUnchecked,
              r.conversionsTotal,
              r.epc,
              r.payout,
            ],
          })),
          {
            style: 'total',
            cells: [
              `Totals For All ${totalRecords} Records`,
              '',
              '',
              tableTotals.clicks || 0,
              tableTotals.approved || 0,
              tableTotals.unchecked || 0,
              tableTotals.totalConv || 0,
              '',
              tableTotals.payout || 0,
            ],
          },
        ],
      };
    }

    if (activeTab === 'conversions') {
      return {
        title: 'Conversions Detailed Ledger',
        subtitle,
        fileName: 'Affiliate-Conversions-Report',
        columns: [
          { label: 'Date', kind: 'date' },
          { label: 'Document Number', kind: 'text' },
          { label: 'External Tx ID', kind: 'text' },
          { label: 'Offer', kind: 'text' },
          { label: 'Network', kind: 'text' },
          { label: 'Publisher', kind: 'text' },
          { label: 'Status', kind: 'text' },
          { label: 'Gross / Revenue', kind: 'money' },
          { label: 'Payout', kind: 'money' },
        ],
        rows: [
          ...tabRows.map((r: any) => ({
            cells: [
              r.date,
              r.documentNumber,
              r.externalTxId || '-',
              r.offerName,
              r.networkName,
              r.publisherName,
              r.status,
              r.revenue,
              r.payout,
            ],
          })),
          {
            style: 'total',
            cells: [
              `Totals For All ${totalRecords} Records`,
              '',
              '',
              '',
              '',
              '',
              '',
              tableTotals.revenue || 0,
              tableTotals.payout || 0,
            ],
          },
        ],
      };
    }

    // Traffic report default
    return {
      title: 'Traffic & Click Sessions Ledger',
      subtitle,
      fileName: 'Affiliate-Traffic-Report',
      columns: [
        { label: 'Date', kind: 'date' },
        { label: 'Document Number', kind: 'text' },
        { label: 'Offer', kind: 'text' },
        { label: 'Publisher', kind: 'text' },
        { label: 'IP Address', kind: 'text' },
        { label: 'Country', kind: 'text' },
        { label: 'Device', kind: 'text' },
        { label: 'Conversion', kind: 'text' },
        { label: 'Revenue', kind: 'money' },
        { label: 'Payout', kind: 'money' },
      ],
      rows: [
        ...tabRows.map((r: any) => ({
          cells: [
            r.date,
            r.documentNumber,
            r.offerName,
            r.publisherName,
            r.ipAddress,
            r.countryCode,
            r.deviceType,
            r.hasConversion ? `Converted (${r.conversionStatus})` : 'No Conversion',
            r.revenue,
            r.payout,
          ],
        })),
        {
          style: 'total',
          cells: [
            `Totals For All ${totalRecords} Records`,
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            tableTotals.revenue || 0,
            tableTotals.payout || 0,
          ],
        },
      ],
    };
  };

  const handlePrint = () => {
    try {
      const doc = buildReportDocument();
      printReport(doc);
    } catch (err: any) {
      alert(err?.message || 'Failed to print report.');
    }
  };

  const handleExportExcel = () => {
    try {
      const doc = buildReportDocument();
      exportToExcel(doc);
      setShowExportMenu(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to export report.');
    }
  };

  const tabsConfig = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'offers', label: 'Offers', icon: Tag },
    { key: 'networks', label: 'Networks', icon: NetworkIcon },
    { key: 'publishers', label: 'Publishers', icon: Users },
    { key: 'conversions', label: 'Conversions', icon: Target },
    { key: 'traffic', label: 'Traffic & Clicks', icon: Zap },
  ] as const;

  const currentTabLabel = tabsConfig.find((t) => t.key === activeTab)?.label || 'Overview';

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & ERP Info Breadcrumb */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-fg-heading">Reports</h1>
          <button
            type="button"
            className="text-fg-subtle hover:text-fg transition p-0.5 rounded cursor-pointer"
            title="Consolidated real-time reports directly from database"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-fg-muted font-medium">
          Affiliate Reports · {currentTabLabel} {subTab === 'details' ? 'Detailed Ledger' : 'Summary'}
        </p>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Horizontal Module Tabs Bar matching ERP styling */}
      <div className="flex items-center gap-2 border-b border-border-subtle overflow-x-auto pb-px">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
                setSearch('');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer border-b-2 ${
                isActive
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-fg-muted hover:text-fg hover:border-border-subtle'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-fg-subtle'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Sub-Tab Pills (when inside individual module tabs) */}
      {activeTab !== 'overview' && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('summary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
              subTab === 'summary'
                ? 'bg-surface-elevated text-primary border-primary shadow-xs'
                : 'bg-surface text-fg-muted border-border-subtle hover:text-fg hover:border-border-strong'
            }`}
          >
            {currentTabLabel} Summary
          </button>
          <button
            type="button"
            onClick={() => setSubTab('details')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
              subTab === 'details'
                ? 'bg-surface-elevated text-primary border-primary shadow-xs'
                : 'bg-surface text-fg-muted border-border-subtle hover:text-fg hover:border-border-strong'
            }`}
          >
            Detailed Ledger
          </button>
        </div>
      )}

      {/* 4. OVERVIEW DASHBOARD VIEW (When Overview tab is active) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Date Filter & Refresh Header */}
          <div className="panel-card p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-fg-heading">Performance Overview</h2>
              <span className="text-xs text-fg-muted bg-surface-elevated px-2.5 py-0.5 rounded-md border border-border-subtle">
                Consolidated Dashboard
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-fg-muted font-medium">Date From:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-border-subtle bg-surface text-fg focus:outline-hidden focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-fg-muted font-medium">Date To:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-border-subtle bg-surface text-fg focus:outline-hidden focus:border-primary"
                />
              </div>

              <button
                type="button"
                onClick={loadData}
                disabled={isLoading}
                className="btn-3d-subtle flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-fg cursor-pointer hover:border-primary transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="btn-3d-subtle flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-fg cursor-pointer hover:border-primary transition"
              >
                <Printer className="w-3.5 h-3.5 text-fg-subtle" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="btn-3d-subtle flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-fg cursor-pointer hover:border-primary transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Metric Tiles Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="panel-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-fg-muted">Clicks</span>
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <MousePointer className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-fg-heading tabular-nums">
                  {overviewData?.summary.totalClicks.toLocaleString() || '0'}
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Live Traffic</span>
              </div>
              <p className="text-[11px] text-fg-subtle mt-1">Total click sessions recorded in database</p>
            </div>

            <div className="panel-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-fg-muted">Conversions</span>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Target className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-fg-heading tabular-nums">
                  {overviewData?.summary.totalConversions.toLocaleString() || '0'}
                </span>
                <span className="text-xs font-semibold text-fg-muted">
                  ({overviewData?.summary.approvedConversions || 0} Approved)
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-fg-subtle">
                <span className="text-emerald-500 font-medium">✓ {overviewData?.summary.approvedConversions || 0}</span>
                <span className="text-amber-500 font-medium">⏳ {overviewData?.summary.uncheckedConversions || 0}</span>
                <span className="text-rose-500 font-medium">✕ {overviewData?.summary.declinedConversions || 0}</span>
              </div>
            </div>

            <div className="panel-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-fg-muted">Gross Revenue</span>
                <span className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-fg-heading tabular-nums">
                  $ {(overviewData?.summary.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">USD</span>
              </div>
              <p className="text-[11px] text-fg-subtle mt-1">
                Net Margin: $ {(overviewData?.summary.netMargin || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({overviewData?.summary.marginPercent || 0}%)
              </p>
            </div>

            <div className="panel-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-fg-muted">Affiliate Payout</span>
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-fg-heading tabular-nums">
                  $ {(overviewData?.summary.totalPayout || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">USD</span>
              </div>
              <p className="text-[11px] text-fg-subtle mt-1">
                Avg EPC: $ {(overviewData?.summary.averageEpc || 0).toFixed(2)} · CR: {(overviewData?.summary.overallCr || 0).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Three Scannable Summary Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Offers */}
            <div className="panel-card p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fg-heading">Top Offers</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('offers')}
                    className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                  >
                    View All →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border-subtle text-fg-muted text-[11px]">
                        <th className="py-2 text-left font-semibold">Offer</th>
                        <th className="py-2 text-right font-semibold">Clicks</th>
                        <th className="py-2 text-right font-semibold">Conv</th>
                        <th className="py-2 text-right font-semibold">Payout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {(overviewData?.topOffers || []).slice(0, 5).map((o) => (
                        <tr key={o.id} className="hover:bg-surface-elevated transition">
                          <td className="py-2 font-medium text-fg-heading truncate max-w-[120px]" title={o.name}>
                            {o.name}
                          </td>
                          <td className="py-2 text-right text-fg tabular-nums">{o.clicks}</td>
                          <td className="py-2 text-right text-fg font-semibold tabular-nums">{o.conversions}</td>
                          <td className="py-2 text-right text-fg font-semibold tabular-nums">$ {o.payout.toFixed(2)}</td>
                        </tr>
                      ))}
                      {(!overviewData?.topOffers || overviewData.topOffers.length === 0) && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-fg-subtle italic">
                            No offers recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Top Networks */}
            <div className="panel-card p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fg-heading">Top Networks</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('networks')}
                    className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                  >
                    View All →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border-subtle text-fg-muted text-[11px]">
                        <th className="py-2 text-left font-semibold">Network</th>
                        <th className="py-2 text-right font-semibold">Conv</th>
                        <th className="py-2 text-right font-semibold">Revenue</th>
                        <th className="py-2 text-right font-semibold">Payout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {(overviewData?.topNetworks || []).slice(0, 5).map((n) => (
                        <tr key={n.id} className="hover:bg-surface-elevated transition">
                          <td className="py-2 font-medium text-fg-heading truncate max-w-[120px]" title={n.name}>
                            {n.name}
                          </td>
                          <td className="py-2 text-right text-fg font-semibold tabular-nums">{n.conversions}</td>
                          <td className="py-2 text-right text-fg tabular-nums">$ {n.revenue.toFixed(2)}</td>
                          <td className="py-2 text-right text-fg font-semibold tabular-nums">$ {n.payout.toFixed(2)}</td>
                        </tr>
                      ))}
                      {(!overviewData?.topNetworks || overviewData.topNetworks.length === 0) && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-fg-subtle italic">
                            No networks recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Top Publishers */}
            <div className="panel-card p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fg-heading">Top Publishers</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('publishers')}
                    className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                  >
                    View All →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border-subtle text-fg-muted text-[11px]">
                        <th className="py-2 text-left font-semibold">Publisher</th>
                        <th className="py-2 text-right font-semibold">Conv</th>
                        <th className="py-2 text-right font-semibold">Payout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {(overviewData?.topPublishers || []).slice(0, 5).map((p) => (
                        <tr key={p.id} className="hover:bg-surface-elevated transition">
                          <td className="py-2 font-medium text-fg-heading truncate max-w-[120px]" title={p.name}>
                            {p.name}
                          </td>
                          <td className="py-2 text-right text-fg font-semibold tabular-nums">{p.conversions}</td>
                          <td className="py-2 text-right text-fg font-semibold tabular-nums">$ {p.payout.toFixed(2)}</td>
                        </tr>
                      ))}
                      {(!overviewData?.topPublishers || overviewData.topPublishers.length === 0) && (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-fg-subtle italic">
                            No publishers recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Conversions Stream */}
          <div className="panel-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-fg-heading">Recent Conversions</h3>
                <p className="text-[11px] text-fg-muted">Latest verified postbacks logged in database</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('conversions')}
                className="text-xs text-primary hover:underline font-semibold cursor-pointer"
              >
                Open Full Ledger →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-subtle text-fg-muted text-[11px]">
                    <th className="py-2 text-left font-semibold">Time</th>
                    <th className="py-2 text-left font-semibold">Tx ID</th>
                    <th className="py-2 text-left font-semibold">Offer</th>
                    <th className="py-2 text-left font-semibold">Network</th>
                    <th className="py-2 text-left font-semibold">Publisher</th>
                    <th className="py-2 text-center font-semibold">Status</th>
                    <th className="py-2 text-right font-semibold">Payout</th>
                    <th className="py-2 text-right font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {(overviewData?.recentConversions || []).map((c) => (
                    <tr key={c.id} className="hover:bg-surface-elevated transition">
                      <td className="py-2 text-fg-muted whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 font-mono text-[11px] text-fg font-medium">{c.externalTxId || '-'}</td>
                      <td className="py-2 font-medium text-fg-heading">{c.offerName}</td>
                      <td className="py-2 text-fg-muted">{c.networkName}</td>
                      <td className="py-2 text-fg-muted">{c.publisherName}</td>
                      <td className="py-2 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            c.status === 'APPROVED'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : c.status === 'UNCHECKED'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2 text-right font-semibold text-fg tabular-nums">$ {c.payout.toFixed(2)}</td>
                      <td className="py-2 text-right text-fg-muted tabular-nums">$ {c.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!overviewData?.recentConversions || overviewData.recentConversions.length === 0) && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-fg-subtle italic">
                        No recent conversions found in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. INDIVIDUAL REPORT VIEW (Offers, Networks, Publishers, Conversions, Traffic) */}
      {activeTab !== 'overview' && (
        <div className="panel-card overflow-hidden">
          {/* Card Titlebar & Refresh Header */}
          <div className="p-4 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold text-fg-heading">{currentTabLabel} Summary</h2>
              <span className="text-xs text-fg-muted bg-surface-elevated px-2 py-0.5 rounded-md border border-border-subtle">
                {totalRecords} Records
              </span>
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="btn-3d-subtle flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-fg cursor-pointer hover:border-primary transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filter Bar Row matching ERP layout */}
          <div className="p-4 border-b border-border-subtle bg-surface-elevated/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            {/* Search Input */}
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-semibold text-fg-heading mb-1">Search</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && loadData()}
                  placeholder="Document Number, Entity, Or Ref"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border-subtle bg-surface text-fg placeholder:text-fg-subtle focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>

            {/* Dropdown Filters */}
            {(activeTab === 'offers' || activeTab === 'conversions') && (
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-semibold text-fg-heading mb-1">Network</label>
                <select
                  value={selectedNetwork}
                  onChange={(e) => {
                    setSelectedNetwork(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border-subtle bg-surface text-fg focus:outline-hidden focus:border-primary"
                >
                  <option value="">All Networks</option>
                  {networksList.map((n) => (
                    <option key={n.id} value={String(n.id)}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(activeTab === 'publishers' || activeTab === 'conversions' || activeTab === 'traffic') && (
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-semibold text-fg-heading mb-1">Offer</label>
                <select
                  value={selectedOffer}
                  onChange={(e) => {
                    setSelectedOffer(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border-subtle bg-surface text-fg focus:outline-hidden focus:border-primary"
                >
                  <option value="">All Offers</option>
                  {offersList.map((o) => (
                    <option key={o.id} value={String(o.id)}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(activeTab === 'conversions' || activeTab === 'traffic') && (
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-semibold text-fg-heading mb-1">Publisher</label>
                <select
                  value={selectedPublisher}
                  onChange={(e) => {
                    setSelectedPublisher(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border-subtle bg-surface text-fg focus:outline-hidden focus:border-primary"
                >
                  <option value="">All Publishers</option>
                  {publishersList.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'conversions' && (
              <div className="lg:col-span-1">
                <label className="block text-[11px] font-semibold text-fg-heading mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-border-subtle bg-surface text-fg focus:outline-hidden focus:border-primary"
                >
                  <option value="ALL">All</option>
                  <option value="APPROVED">Approved</option>
                  <option value="UNCHECKED">Unchecked</option>
                  <option value="DECLINED">Declined</option>
                </select>
              </div>
            )}

            {/* Date Range Inputs */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold text-fg-heading mb-1">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-border-subtle bg-surface text-fg focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold text-fg-heading mb-1">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-border-subtle bg-surface text-fg focus:outline-hidden focus:border-primary"
              />
            </div>

            {/* Amount Range Filters */}
            <div className="lg:col-span-1">
              <label className="block text-[11px] font-semibold text-fg-heading mb-1">Amount From</label>
              <input
                type="number"
                value={amountFrom}
                onChange={(e) => {
                  setAmountFrom(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="0.00"
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-border-subtle bg-surface text-fg focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-[11px] font-semibold text-fg-heading mb-1">Amount To</label>
              <input
                type="number"
                value={amountTo}
                onChange={(e) => {
                  setAmountTo(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Max"
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-border-subtle bg-surface text-fg focus:outline-hidden focus:border-primary"
              />
            </div>

            {/* Action Buttons: Print & Export */}
            <div className="lg:col-span-2 flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handlePrint}
                className="btn-3d-subtle flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-fg cursor-pointer hover:border-primary transition"
                title="Print or save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-fg-subtle" />
                <span>Print</span>
              </button>

              <div className="relative" ref={exportMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="btn-3d-subtle flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-fg cursor-pointer hover:border-primary transition"
                  title="Export to Excel or PDF"
                >
                  <Download className="w-3.5 h-3.5 text-fg-subtle" />
                  <span>Export</span>
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-1 w-44 rounded-xl bg-surface border border-border-subtle shadow-xl z-30 p-1 divide-y divide-border-subtle text-xs">
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-fg hover:bg-surface-elevated rounded-lg transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      <span>Export to Excel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        handlePrint();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-fg hover:bg-surface-elevated rounded-lg transition cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span>Export to PDF</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-elevated/80 border-b border-border-subtle text-fg-muted font-bold text-[11px]">
                  <th className="py-2.5 px-3 text-left">Document Number</th>
                  {activeTab === 'offers' && (
                    <>
                      <th className="py-2.5 px-3 text-left">Offer Name</th>
                      <th className="py-2.5 px-3 text-left">Network</th>
                      <th className="py-2.5 px-3 text-right">Clicks</th>
                      <th className="py-2.5 px-3 text-right">Conversions</th>
                      <th className="py-2.5 px-3 text-right">CR %</th>
                      <th className="py-2.5 px-3 text-right">EPC</th>
                      <th className="py-2.5 px-3 text-right">Payout</th>
                      <th className="py-2.5 px-3 text-right">Revenue</th>
                    </>
                  )}
                  {activeTab === 'networks' && (
                    <>
                      <th className="py-2.5 px-3 text-left">Network Name</th>
                      <th className="py-2.5 px-3 text-left">Associated Offer</th>
                      <th className="py-2.5 px-3 text-right">Clicks</th>
                      <th className="py-2.5 px-3 text-right">Approved</th>
                      <th className="py-2.5 px-3 text-right">Unchecked</th>
                      <th className="py-2.5 px-3 text-right">Total Conv</th>
                      <th className="py-2.5 px-3 text-right">Payout</th>
                      <th className="py-2.5 px-3 text-right">Revenue</th>
                    </>
                  )}
                  {activeTab === 'publishers' && (
                    <>
                      <th className="py-2.5 px-3 text-left">Publisher Name</th>
                      <th className="py-2.5 px-3 text-left">Assigned Offer</th>
                      <th className="py-2.5 px-3 text-right">Clicks</th>
                      <th className="py-2.5 px-3 text-right">Approved</th>
                      <th className="py-2.5 px-3 text-right">Unchecked</th>
                      <th className="py-2.5 px-3 text-right">Total Conv</th>
                      <th className="py-2.5 px-3 text-right">EPC</th>
                      <th className="py-2.5 px-3 text-right">Payout</th>
                    </>
                  )}
                  {activeTab === 'conversions' && (
                    <>
                      <th className="py-2.5 px-3 text-left">Date</th>
                      <th className="py-2.5 px-3 text-left">Offer</th>
                      <th className="py-2.5 px-3 text-left">Network</th>
                      <th className="py-2.5 px-3 text-left">Publisher</th>
                      <th className="py-2.5 px-3 text-left">Tx ID</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Gross / Revenue</th>
                      <th className="py-2.5 px-3 text-right">Payout</th>
                    </>
                  )}
                  {activeTab === 'traffic' && (
                    <>
                      <th className="py-2.5 px-3 text-left">Date</th>
                      <th className="py-2.5 px-3 text-left">Offer</th>
                      <th className="py-2.5 px-3 text-left">Publisher</th>
                      <th className="py-2.5 px-3 text-left">IP Address</th>
                      <th className="py-2.5 px-3 text-left">GEO / Device</th>
                      <th className="py-2.5 px-3 text-center">Conversion</th>
                      <th className="py-2.5 px-3 text-right">Revenue</th>
                      <th className="py-2.5 px-3 text-right">Payout</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-border-subtle">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-fg-muted">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        <span>Querying live database records...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-fg-subtle italic">
                      No records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row: any, idx) => (
                    <tr key={row.id ?? idx} className="hover:bg-surface-elevated/70 transition">
                      <td className="py-2.5 px-3 font-mono font-medium text-fg-heading">
                        {row.documentNumber || `DOC-${String(row.id).padStart(4, '0')}`}
                      </td>

                      {activeTab === 'offers' && (
                        <>
                          <td className="py-2.5 px-3 font-semibold text-fg-heading">{row.name}</td>
                          <td className="py-2.5 px-3 text-fg-muted">{row.networkName || '-'}</td>
                          <td className="py-2.5 px-3 text-right text-fg tabular-nums">{row.clicks}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-fg tabular-nums">{row.conversions}</td>
                          <td className="py-2.5 px-3 text-right text-fg tabular-nums">
                            {(row.cr !== undefined ? row.cr : row.clicks > 0 ? (row.conversions / row.clicks) * 100 : 0).toFixed(2)}%
                          </td>
                          <td className="py-2.5 px-3 text-right text-fg tabular-nums">$ {Number(row.epc || 0).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-fg tabular-nums">$ {Number(row.payout || 0).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right text-fg-muted tabular-nums">$ {Number(row.revenue || 0).toFixed(2)}</td>
                        </>
                      )}

                      {activeTab === 'networks' && (
                        <>
                          <td className="py-2.5 px-3 font-semibold text-fg-heading">{row.name}</td>
                          <td className="py-2.5 px-3 text-fg-muted">{row.offer || '-'}</td>
                          <td className="py-2.5 px-3 text-right text-fg tabular-nums">{row.clicks}</td>
                          <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                            {row.conversionsApproved}
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400 tabular-nums">
                            {row.conversionsUnchecked}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-fg tabular-nums">{row.conversionsTotal}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-fg tabular-nums">$ {Number(row.payout || 0).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right text-fg-muted tabular-nums">$ {Number(row.revenue || 0).toFixed(2)}</td>
                        </>
                      )}

                      {activeTab === 'publishers' && (
                        <>
                          <td className="py-2.5 px-3 font-semibold text-fg-heading">{row.name}</td>
                          <td className="py-2.5 px-3 text-fg-muted">{row.offer || '-'}</td>
                          <td className="py-2.5 px-3 text-right text-fg tabular-nums">{row.clicks}</td>
                          <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                            {row.conversionsApproved}
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400 tabular-nums">
                            {row.conversionsUnchecked}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-fg tabular-nums">{row.conversionsTotal}</td>
                          <td className="py-2.5 px-3 text-right text-fg tabular-nums">$ {Number(row.epc || 0).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-fg tabular-nums">$ {Number(row.payout || 0).toFixed(2)}</td>
                        </>
                      )}

                      {activeTab === 'conversions' && (
                        <>
                          <td className="py-2.5 px-3 text-fg-muted whitespace-nowrap">
                            {new Date(row.date).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-fg-heading">{row.offerName}</td>
                          <td className="py-2.5 px-3 text-fg-muted">{row.networkName}</td>
                          <td className="py-2.5 px-3 text-fg-muted">{row.publisherName}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-fg">{row.externalTxId || '-'}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                row.status === 'APPROVED'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : row.status === 'UNCHECKED'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-fg-muted tabular-nums">$ {Number(row.revenue || 0).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-fg tabular-nums">$ {Number(row.payout || 0).toFixed(2)}</td>
                        </>
                      )}

                      {activeTab === 'traffic' && (
                        <>
                          <td className="py-2.5 px-3 text-fg-muted whitespace-nowrap">
                            {new Date(row.date).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-fg-heading">{row.offerName}</td>
                          <td className="py-2.5 px-3 text-fg-muted">{row.publisherName}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-fg">{row.ipAddress}</td>
                          <td className="py-2.5 px-3 text-fg-muted">
                            {row.countryCode} · {row.deviceType}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {row.hasConversion ? (
                              <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{row.conversionStatus}</span>
                              </span>
                            ) : (
                              <span className="text-fg-subtle text-[11px]">No Conv</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-fg-muted tabular-nums">$ {Number(row.revenue || 0).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-fg tabular-nums">$ {Number(row.payout || 0).toFixed(2)}</td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>

              {/* Totals Summary Row matching ERP */}
              {tabRows.length > 0 && (
                <tfoot>
                  <tr className="bg-surface-elevated font-extrabold border-t-2 border-border-strong text-fg-heading">
                    <td colSpan={activeTab === 'offers' ? 3 : activeTab === 'networks' ? 3 : activeTab === 'publishers' ? 3 : activeTab === 'conversions' ? 7 : 7} className="py-3 px-3">
                      Totals For All {totalRecords} Records
                    </td>
                    {activeTab === 'offers' && (
                      <>
                        <td className="py-3 px-3 text-right tabular-nums">{tableTotals.clicks || 0}</td>
                        <td className="py-3 px-3 text-right tabular-nums">{tableTotals.conversions || 0}</td>
                        <td className="py-3 px-3 text-right">-</td>
                        <td className="py-3 px-3 text-right">-</td>
                        <td className="py-3 px-3 text-right tabular-nums">$ {(tableTotals.payout || 0).toFixed(2)}</td>
                        <td className="py-3 px-3 text-right tabular-nums">$ {(tableTotals.revenue || 0).toFixed(2)}</td>
                      </>
                    )}
                    {activeTab === 'networks' && (
                      <>
                        <td className="py-3 px-3 text-right tabular-nums">{tableTotals.clicks || 0}</td>
                        <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">{tableTotals.approved || 0}</td>
                        <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400 tabular-nums">{tableTotals.unchecked || 0}</td>
                        <td className="py-3 px-3 text-right tabular-nums">{tableTotals.totalConv || 0}</td>
                        <td className="py-3 px-3 text-right tabular-nums">$ {(tableTotals.payout || 0).toFixed(2)}</td>
                        <td className="py-3 px-3 text-right tabular-nums">$ {(tableTotals.revenue || 0).toFixed(2)}</td>
                      </>
                    )}
                    {activeTab === 'publishers' && (
                      <>
                        <td className="py-3 px-3 text-right tabular-nums">{tableTotals.clicks || 0}</td>
                        <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">{tableTotals.approved || 0}</td>
                        <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400 tabular-nums">{tableTotals.unchecked || 0}</td>
                        <td className="py-3 px-3 text-right tabular-nums">{tableTotals.totalConv || 0}</td>
                        <td className="py-3 px-3 text-right">-</td>
                        <td className="py-3 px-3 text-right tabular-nums">$ {(tableTotals.payout || 0).toFixed(2)}</td>
                      </>
                    )}
                    {activeTab === 'conversions' && (
                      <>
                        <td className="py-3 px-3 text-right tabular-nums">$ {(tableTotals.revenue || 0).toFixed(2)}</td>
                        <td className="py-3 px-3 text-right tabular-nums">$ {(tableTotals.payout || 0).toFixed(2)}</td>
                      </>
                    )}
                    {activeTab === 'traffic' && (
                      <>
                        <td className="py-3 px-3 text-right tabular-nums">$ {(tableTotals.revenue || 0).toFixed(2)}</td>
                        <td className="py-3 px-3 text-right tabular-nums">$ {(tableTotals.payout || 0).toFixed(2)}</td>
                      </>
                    )}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination Controls matching ERP */}
          <div className="p-3 border-t border-border-subtle bg-surface-elevated/20 flex flex-wrap items-center justify-between gap-3 text-xs text-fg-muted">
            <div>
              Page {currentPage} of {totalPages} · {totalRecords === 0 ? '0' : (currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, totalRecords)} Records
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span>Per Page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-md border border-border-subtle bg-surface text-fg focus:outline-hidden"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-md border border-border-subtle hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-md border border-border-subtle hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
