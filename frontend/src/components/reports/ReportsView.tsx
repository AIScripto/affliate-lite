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
  FileText,
  Activity
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

/**
 * Computes a smoothed SVG path from real chronological trend points using cubic Bezier interpolation.
 * Eliminates all static or hardcoded graph paths.
 */
function generateSmoothSvg(points: number[], width = 200, height = 40, padding = 4) {
  if (!points || points.length === 0) {
    return {
      fillPath: `M 0,${height} L ${width},${height} Z`,
      strokePath: `M 0,${height - padding} L ${width},${height - padding}`,
      lastX: width,
      lastY: height - padding,
    };
  }

  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const range = maxVal - minVal || 1;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1 || 1)) * width;
    const norm = (val - minVal) / range;
    const y = height - padding - norm * (height - 2 * padding);
    return { x, y };
  });

  if (coords.length === 1) {
    coords.push({ x: width, y: coords[0].y });
  }

  let strokePath = `M ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(i - 1, 0)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(i + 2, coords.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    strokePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  const last = coords[coords.length - 1];
  const fillPath = `${strokePath} L ${width},${height} L 0,${height} Z`;

  return {
    fillPath,
    strokePath,
    lastX: last.x,
    lastY: last.y,
  };
}

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
    <div className="space-y-3.5">
      {/* 1. Header with Title & Compact Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-strong pb-2">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight text-fg-heading">Reports</h1>
          <span className="text-fg-subtle text-xs">/</span>
          <span className="text-xs font-semibold text-fg-muted">
            Affiliate Reports · {currentTabLabel} {subTab === 'details' ? 'Detailed Ledger' : 'Summary'}
          </span>
          <button
            type="button"
            className="text-fg-subtle hover:text-fg transition p-0.5 rounded cursor-pointer"
            title="Consolidated real-time reports directly from database"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="btn-3d-subtle flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-fg cursor-pointer hover:border-primary transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="btn-3d-subtle flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-fg cursor-pointer hover:border-primary transition"
            title="Print or save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-fg-subtle" />
            <span>Print</span>
          </button>

          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-3d-subtle flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-fg cursor-pointer hover:border-primary transition"
              title="Export report"
            >
              <Download className="w-3.5 h-3.5 text-fg-subtle" />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-surface border border-border-strong shadow-xl z-30 p-1 divide-y divide-border-strong text-xs">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-fg hover:bg-surface-elevated rounded-lg transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Export to Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    handlePrint();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-fg hover:bg-surface-elevated rounded-lg transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Export to PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Compact Horizontal Module Tabs Bar with Tactile 3D Styling */}
      <div className="flex items-center gap-1.5 border-b border-border-strong overflow-x-auto pb-1.5">
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
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer rounded-lg ${
                isActive
                  ? 'btn-3d-primary text-white shadow-md'
                  : 'btn-3d-subtle text-slate-200 dark:text-slate-200 hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* Sub-Tab Pills (compact pill buttons for non-overview tabs) */}
        {activeTab !== 'overview' && (
          <div className="flex items-center gap-1.5 ml-auto pl-2 border-l border-border-strong">
            <button
              type="button"
              onClick={() => setSubTab('summary')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                subTab === 'summary'
                  ? 'btn-3d-primary text-white shadow-xs'
                  : 'btn-3d-subtle text-slate-200 dark:text-slate-200 hover:text-white'
              }`}
            >
              Summary
            </button>
            <button
              type="button"
              onClick={() => setSubTab('details')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                subTab === 'details'
                  ? 'btn-3d-primary text-white shadow-xs'
                  : 'btn-3d-subtle text-slate-200 dark:text-slate-200 hover:text-white'
              }`}
            >
              Detailed Ledger
            </button>
          </div>
        )}
      </div>

      {/* 3. OVERVIEW DASHBOARD VIEW - 100% Real Database Derived */}
      {activeTab === 'overview' && (() => {
        const sum = overviewData?.summary;
        const totalClicks = sum?.totalClicks ?? 0;
        const totalConvs = sum?.totalConversions ?? 0;
        const approvedConvs = sum?.approvedConversions ?? 0;
        const uncheckedConvs = sum?.uncheckedConversions ?? 0;
        const totalRevenue = sum?.totalRevenue ?? 0;
        const totalPayout = sum?.totalPayout ?? 0;
        const netMargin = sum?.netMargin ?? 0;
        const marginPercent = sum?.marginPercent ?? 0;
        const overallCr = sum?.overallCr ?? 0;
        const averageEpc = sum?.averageEpc ?? 0;

        // Dynamic Bezier Sparklines computed from real Prisma aggregation trends
        const clickTrend = overviewData?.trends?.clicks && overviewData.trends.clicks.length > 0
          ? overviewData.trends.clicks
          : [0, totalClicks];
        const clickSvg = generateSmoothSvg(clickTrend, 200, 40);

        const convTrend = overviewData?.trends?.conversions && overviewData.trends.conversions.length > 0
          ? overviewData.trends.conversions
          : [0, totalConvs];
        const convSvg = generateSmoothSvg(convTrend, 200, 40);

        const revTrend = overviewData?.trends?.revenue && overviewData.trends.revenue.length > 0
          ? overviewData.trends.revenue
          : [0, totalRevenue];
        const revSvg = generateSmoothSvg(revTrend, 200, 40);

        const payoutTrend = overviewData?.trends?.payout && overviewData.trends.payout.length > 0
          ? overviewData.trends.payout
          : [0, totalPayout];
        const payoutSvg = generateSmoothSvg(payoutTrend, 200, 40);

        // Real Timeline Buckets from DB
        const timelineBuckets = overviewData?.timeline && overviewData.timeline.length > 0
          ? overviewData.timeline
          : [
              { label: '00:00', clicks: 0, conversions: 0, payout: 0, revenue: 0 },
              { label: '04:00', clicks: 0, conversions: 0, payout: 0, revenue: 0 },
              { label: '08:00', clicks: 0, conversions: 0, payout: 0, revenue: 0 },
              { label: '12:00', clicks: 0, conversions: 0, payout: 0, revenue: 0 },
              { label: '16:00', clicks: 0, conversions: 0, payout: 0, revenue: 0 },
              { label: '20:00', clicks: 0, conversions: 0, payout: 0, revenue: 0 },
            ];

        const maxClicksInTimeline = Math.max(...timelineBuckets.map((b) => b.clicks), 1);
        const yMax = Math.max(Math.ceil(maxClicksInTimeline / 10) * 10, 10);
        const yTicks = [yMax, Math.round(yMax * 0.75), Math.round(yMax * 0.5), Math.round(yMax * 0.25), 0];

        return (
          <div className="space-y-3.5">
            {/* Top Row: 4 Gradient Sparkline Metric Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Tile 1: Active Traffic / Clicks */}
              <div className="panel-card p-3.5 border border-border-strong relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                        <MousePointer className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200 dark:text-slate-200">
                        Active Clicks
                      </span>
                    </div>
                    <span className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                      CR {overallCr.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-white tracking-tight tabular-nums">
                    {totalClicks.toLocaleString()}
                  </div>
                </div>

                {/* Glowing SVG Wave Sparkline (Neon Blue) */}
                <div className="mt-2 -mx-1">
                  <svg className="w-full h-10 overflow-visible" viewBox="0 0 200 40" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={clickSvg.fillPath} fill="url(#clickGrad)" />
                    <path
                      d={clickSvg.strokePath}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx={clickSvg.lastX} cy={clickSvg.lastY} r="3.5" fill="#38bdf8" className="animate-pulse" />
                  </svg>
                </div>

                <div className="text-xs text-slate-200 dark:text-slate-200 pt-1.5 border-t border-border-strong flex items-center justify-between font-semibold">
                  <span>Real-time redirects</span>
                  <span className="text-emerald-400 font-bold">100% Attribution</span>
                </div>
              </div>

              {/* Tile 2: Conversions */}
              <div className="panel-card p-3.5 border border-border-strong relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Target className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200 dark:text-slate-200">
                        Conversions
                      </span>
                    </div>
                    <span className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {approvedConvs} Approved
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-white tracking-tight tabular-nums">
                    {totalConvs.toLocaleString()}
                  </div>
                </div>

                {/* Glowing SVG Wave Sparkline (Neon Emerald) */}
                <div className="mt-2 -mx-1">
                  <svg className="w-full h-10 overflow-visible" viewBox="0 0 200 40" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={convSvg.fillPath} fill="url(#convGrad)" />
                    <path
                      d={convSvg.strokePath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx={convSvg.lastX} cy={convSvg.lastY} r="3.5" fill="#10b981" className="animate-pulse" />
                  </svg>
                </div>

                <div className="text-xs text-slate-200 dark:text-slate-200 pt-1.5 border-t border-border-strong flex items-center justify-between font-semibold">
                  <span className="text-emerald-400 font-bold">{approvedConvs} Approved</span>
                  <span className="text-amber-400 font-bold">{uncheckedConvs} Unchecked</span>
                </div>
              </div>

              {/* Tile 3: Gross Revenue */}
              <div className="panel-card p-3.5 border border-border-strong relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <DollarSign className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200 dark:text-slate-200">
                        Gross Revenue
                      </span>
                    </div>
                    <span className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      Margin {marginPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-white tracking-tight tabular-nums">
                    $ {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Glowing SVG Wave Sparkline (Neon Indigo/Cyan) */}
                <div className="mt-2 -mx-1">
                  <svg className="w-full h-10 overflow-visible" viewBox="0 0 200 40" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={revSvg.fillPath} fill="url(#revGrad)" />
                    <path
                      d={revSvg.strokePath}
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx={revSvg.lastX} cy={revSvg.lastY} r="3.5" fill="#818cf8" className="animate-pulse" />
                  </svg>
                </div>

                <div className="text-xs text-slate-200 dark:text-slate-200 pt-1.5 border-t border-border-strong flex items-center justify-between font-semibold">
                  <span>Net Margin</span>
                  <span className="text-emerald-400 font-bold">$ {netMargin.toFixed(2)}</span>
                </div>
              </div>

              {/* Tile 4: Affiliate Payout */}
              <div className="panel-card p-3.5 border border-border-strong relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200 dark:text-slate-200">
                        Total Payout
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      CR {overallCr.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-white tracking-tight tabular-nums">
                    $ {totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Glowing SVG Wave Sparkline (Neon Amber) */}
                <div className="mt-2 -mx-1">
                  <svg className="w-full h-10 overflow-visible" viewBox="0 0 200 40" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="payoutGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={payoutSvg.fillPath} fill="url(#payoutGrad)" />
                    <path
                      d={payoutSvg.strokePath}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx={payoutSvg.lastX} cy={payoutSvg.lastY} r="3.5" fill="#f59e0b" className="animate-pulse" />
                  </svg>
                </div>

                <div className="text-xs text-slate-200 dark:text-slate-200 pt-1.5 border-t border-border-strong flex items-center justify-between font-semibold">
                  <span>Average EPC</span>
                  <span className="text-amber-400 font-bold">$ {averageEpc.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Middle Row: Two High-Impact Visualization Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              {/* Left 7 cols: Traffic & Performance Gradient Bars Chart (Real Chronological Buckets) */}
              <div className="lg:col-span-7 panel-card border border-border-strong p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-border-strong pb-2 mb-3">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-fg-heading">Traffic & Performance</h2>
                      <p className="text-xs text-slate-300 dark:text-slate-300">Real database acquisition velocity vs postbacks</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-fg">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                        Requests / Clicks
                      </span>
                      <span className="flex items-center gap-1.5 font-semibold text-fg">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        Conversions
                      </span>
                    </div>
                  </div>

                  {/* Gradient Bar Chart with Dynamic Guidelines & Real Heights */}
                  <div className="relative pt-2">
                    <div className="flex justify-between text-xs text-slate-300 dark:text-slate-300 border-b border-border-strong pb-1 font-semibold">
                      {yTicks.map((val, idx) => (
                        <span key={idx}>{val}</span>
                      ))}
                    </div>

                    {/* SVG Vertical Gradient Bars - Calculated dynamically from DB */}
                    <svg className="w-full h-36 mt-1" viewBox="0 0 600 130" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#1e3a8a" />
                        </linearGradient>
                        <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" />
                          <stop offset="100%" stopColor="#881337" />
                        </linearGradient>
                      </defs>

                      {/* Subtle horizontal grid lines */}
                      <line x1="0" y1="20" x2="600" y2="20" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                      <line x1="0" y1="44" x2="600" y2="44" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                      <line x1="0" y1="68" x2="600" y2="68" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                      <line x1="0" y1="92" x2="600" y2="92" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                      <line x1="0" y1="115" x2="600" y2="115" stroke="currentColor" strokeOpacity="0.15" />

                      {/* Dynamic Bars derived 100% from PostgreSQL */}
                      {timelineBuckets.map((b, i) => {
                        const n = timelineBuckets.length;
                        const colWidth = 600 / n;
                        const barW = Math.min(Math.max(colWidth * 0.45, 18), 36);
                        const x = i * colWidth + (colWidth - barW) / 2;
                        const clickH = b.clicks > 0 ? Math.max(Math.round((b.clicks / yMax) * 95), 6) : 2;
                        const convH = b.conversions > 0 ? Math.max(Math.round((b.conversions / yMax) * 95), 4) : 0;

                        return (
                          <g key={i}>
                            <title>{`${b.label}: ${b.clicks} Clicks, ${b.conversions} Conversions ($${b.payout.toFixed(2)} Payout)`}</title>
                            {/* Blue clicks bar */}
                            <rect
                              x={x}
                              y={115 - clickH}
                              width={barW}
                              height={clickH}
                              rx="3"
                              fill="url(#barBlue)"
                              className="hover:opacity-85 transition cursor-pointer"
                            />
                            {/* Red/Rose conversions accent */}
                            {convH > 0 && (
                              <rect
                                x={x}
                                y={115 - convH}
                                width={barW}
                                height={convH}
                                rx="2"
                                fill="url(#barRed)"
                                className="hover:opacity-85 transition cursor-pointer"
                              />
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {/* Timeline dynamic labels */}
                    <div className="flex justify-between text-xs text-slate-300 dark:text-slate-300 pt-1.5 border-t border-border-strong font-mono font-semibold">
                      {timelineBuckets.map((s, idx) => (
                        <span key={idx} className="text-center">{s.label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 5 cols: Recent Conversions List */}
              <div className="lg:col-span-5 panel-card border border-border-strong p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-border-strong pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-primary" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-fg-heading">Recent Conversions</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('conversions')}
                      className="text-xs text-primary hover:underline font-bold cursor-pointer"
                    >
                      View all →
                    </button>
                  </div>

                  {/* Activity List matching RapidBuild image style */}
                  <div className="space-y-1.5 mt-2">
                    {(overviewData?.recentConversions || []).slice(0, 5).map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated border border-border-strong hover:border-primary transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                              c.status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            }`}
                          >
                            {c.status === 'APPROVED' ? '✓ Approved' : '⏳ Pending'}
                          </span>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-100 dark:text-slate-100 truncate">{c.offerName}</p>
                            <p className="text-xs text-slate-300 dark:text-slate-300 truncate">
                              {c.publisherName} · ${c.payout.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-300 dark:text-slate-300 whitespace-nowrap font-mono font-medium">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                      </div>
                    ))}

                    {(!overviewData?.recentConversions || overviewData.recentConversions.length === 0) && (
                      <div className="py-8 text-center text-slate-400 italic text-xs">
                        No conversions logged in database yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Executive Summary Performance Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {/* Top Offers Summary */}
              <div className="panel-card border border-border-strong overflow-hidden">
                <div className="bg-surface-elevated px-3 py-2 border-b border-border-strong flex items-center justify-between">
                  <span className="text-xs font-bold text-fg-heading uppercase tracking-wider">Top Performing Offers</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('offers')}
                    className="text-xs text-primary hover:underline font-bold cursor-pointer"
                  >
                    View All Offers →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-elevated border-b-2 border-border-strong text-slate-200 dark:text-slate-200 text-xs font-extrabold uppercase tracking-wider">
                        <th className="py-2 px-3 text-left">Offer</th>
                        <th className="py-2 px-3 text-left">Network</th>
                        <th className="py-2 px-3 text-right">Clicks</th>
                        <th className="py-2 px-3 text-right">Conv</th>
                        <th className="py-2 px-3 text-right">CR %</th>
                        <th className="py-2 px-3 text-right">Payout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/70">
                      {(overviewData?.topOffers || []).slice(0, 5).map((o) => (
                        <tr key={o.id} className="hover:bg-surface-elevated/60 transition">
                          <td className="py-2 px-3 font-bold text-slate-100 dark:text-slate-100 truncate max-w-[130px]">{o.name}</td>
                          <td className="py-2 px-3 text-slate-300 dark:text-slate-300 truncate max-w-[100px]">{o.networkName}</td>
                          <td className="py-2 px-3 text-right text-slate-100 dark:text-slate-100 font-medium tabular-nums">{o.clicks}</td>
                          <td className="py-2 px-3 text-right font-extrabold text-slate-100 dark:text-slate-100 tabular-nums">{o.conversions}</td>
                          <td className="py-2 px-3 text-right text-slate-200 dark:text-slate-200 font-semibold tabular-nums">{o.cr.toFixed(1)}%</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-400 tabular-nums">
                            ${o.payout.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {(!overviewData?.topOffers || overviewData.topOffers.length === 0) && (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                            No offers recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Networks & Publishers */}
              <div className="panel-card border border-border-strong overflow-hidden">
                <div className="bg-surface-elevated px-3 py-2 border-b border-border-strong flex items-center justify-between">
                  <span className="text-xs font-bold text-fg-heading uppercase tracking-wider">Top Networks & Volume</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('networks')}
                    className="text-xs text-primary hover:underline font-bold cursor-pointer"
                  >
                    View All Networks →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-elevated border-b-2 border-border-strong text-slate-200 dark:text-slate-200 text-xs font-extrabold uppercase tracking-wider">
                        <th className="py-2 px-3 text-left">Network</th>
                        <th className="py-2 px-3 text-right">Conv</th>
                        <th className="py-2 px-3 text-right">Revenue</th>
                        <th className="py-2 px-3 text-right">Payout</th>
                        <th className="py-2 px-3 text-right">Net Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/70">
                      {(overviewData?.topNetworks || []).slice(0, 5).map((n) => (
                        <tr key={n.id} className="hover:bg-surface-elevated/60 transition">
                          <td className="py-2 px-3 font-bold text-slate-100 dark:text-slate-100 truncate max-w-[130px]">{n.name}</td>
                          <td className="py-2 px-3 text-right font-extrabold text-slate-100 dark:text-slate-100 tabular-nums">{n.conversions}</td>
                          <td className="py-2 px-3 text-right text-slate-100 dark:text-slate-100 font-medium tabular-nums">${n.revenue.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-semibold text-slate-100 dark:text-slate-100 tabular-nums">${n.payout.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-400 tabular-nums">
                            ${(n.revenue - n.payout).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {(!overviewData?.topNetworks || overviewData.topNetworks.length === 0) && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                            No networks recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 4. INDIVIDUAL REPORT VIEW (Offers, Networks, Publishers, Conversions, Traffic) */}
      {activeTab !== 'overview' && (
        <div className="panel-card border border-border-strong shadow-md rounded-xl bg-surface overflow-hidden">
          {/* Card Titlebar & Section Header */}
          <div className="bg-surface-elevated px-3.5 py-2 border-b border-border-strong flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-fg-heading">
                {currentTabLabel} Summary
              </h2>
              <span className="text-[11px] font-semibold text-fg-muted bg-surface px-2 py-0.5 rounded border border-border-strong">
                {totalRecords} Records
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                disabled={isLoading}
                className="btn-3d-subtle flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-fg cursor-pointer hover:border-primary transition"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filter Bar Row with distinct background and visible borders */}
          <div className="bg-canvas/50 px-3.5 py-2.5 border-b border-border-strong flex flex-wrap items-end gap-2.5 text-xs">
            {/* Search Input */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-0.5">Search</label>
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
                  placeholder="Document #, Entity, or Ref..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md border border-border-strong bg-surface text-fg placeholder:text-fg-subtle focus:outline-hidden focus:border-primary shadow-2xs"
                />
              </div>
            </div>

            {/* Dropdown Filters */}
            {(activeTab === 'offers' || activeTab === 'conversions') && (
              <div className="w-36">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-0.5">Network</label>
                <select
                  value={selectedNetwork}
                  onChange={(e) => {
                    setSelectedNetwork(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2 py-1 text-xs rounded-md border border-border-strong bg-surface text-fg focus:outline-hidden focus:border-primary shadow-2xs"
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
              <div className="w-36">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-0.5">Offer</label>
                <select
                  value={selectedOffer}
                  onChange={(e) => {
                    setSelectedOffer(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2 py-1 text-xs rounded-md border border-border-strong bg-surface text-fg focus:outline-hidden focus:border-primary shadow-2xs"
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
              <div className="w-36">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-0.5">Publisher</label>
                <select
                  value={selectedPublisher}
                  onChange={(e) => {
                    setSelectedPublisher(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2 py-1 text-xs rounded-md border border-border-strong bg-surface text-fg focus:outline-hidden focus:border-primary shadow-2xs"
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
              <div className="w-28">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-0.5">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2 py-1 text-xs rounded-md border border-border-strong bg-surface text-fg focus:outline-hidden focus:border-primary shadow-2xs"
                >
                  <option value="ALL">All</option>
                  <option value="APPROVED">Approved</option>
                  <option value="UNCHECKED">Unchecked</option>
                  <option value="DECLINED">Declined</option>
                </select>
              </div>
            )}

            {/* Date Range Inputs */}
            <div className="w-32">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-0.5">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1 text-xs rounded-md border border-border-strong bg-surface text-fg focus:outline-hidden focus:border-primary shadow-2xs"
              />
            </div>

            <div className="w-32">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-0.5">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1 text-xs rounded-md border border-border-strong bg-surface text-fg focus:outline-hidden focus:border-primary shadow-2xs"
              />
            </div>

            {/* Amount Range Filters */}
            <div className="w-24">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-0.5">Amount From</label>
              <input
                type="number"
                value={amountFrom}
                onChange={(e) => {
                  setAmountFrom(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="0.00"
                className="w-full px-2 py-1 text-xs rounded-md border border-border-strong bg-surface text-fg focus:outline-hidden focus:border-primary shadow-2xs"
              />
            </div>

            <div className="w-24">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-0.5">Amount To</label>
              <input
                type="number"
                value={amountTo}
                onChange={(e) => {
                  setAmountTo(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Max"
                className="w-full px-2 py-1 text-xs rounded-md border border-border-strong bg-surface text-fg focus:outline-hidden focus:border-primary shadow-2xs"
              />
            </div>

            {/* Action Buttons: Print & Export */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="btn-3d-subtle flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-fg cursor-pointer hover:border-primary transition"
                title="Print or save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-fg-subtle" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="btn-3d-subtle flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-fg cursor-pointer hover:border-primary transition"
                title="Export to Excel (.csv)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Table Container with high-contrast borders */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-elevated border-b-2 border-border-strong text-fg-heading font-bold text-[11px]">
                  <th className="py-2 px-3 text-left">Document Number</th>
                  {activeTab === 'offers' && (
                    <>
                      <th className="py-2 px-3 text-left">Offer Name</th>
                      <th className="py-2 px-3 text-left">Network</th>
                      <th className="py-2 px-3 text-right">Clicks</th>
                      <th className="py-2 px-3 text-right">Conversions</th>
                      <th className="py-2 px-3 text-right">CR %</th>
                      <th className="py-2 px-3 text-right">EPC</th>
                      <th className="py-2 px-3 text-right">Payout</th>
                      <th className="py-2 px-3 text-right">Revenue</th>
                    </>
                  )}
                  {activeTab === 'networks' && (
                    <>
                      <th className="py-2 px-3 text-left">Network Name</th>
                      <th className="py-2 px-3 text-left">Associated Offer</th>
                      <th className="py-2 px-3 text-right">Clicks</th>
                      <th className="py-2 px-3 text-right">Approved</th>
                      <th className="py-2 px-3 text-right">Unchecked</th>
                      <th className="py-2 px-3 text-right">Total Conv</th>
                      <th className="py-2 px-3 text-right">Payout</th>
                      <th className="py-2 px-3 text-right">Revenue</th>
                    </>
                  )}
                  {activeTab === 'publishers' && (
                    <>
                      <th className="py-2 px-3 text-left">Publisher Name</th>
                      <th className="py-2 px-3 text-left">Assigned Offer</th>
                      <th className="py-2 px-3 text-right">Clicks</th>
                      <th className="py-2 px-3 text-right">Approved</th>
                      <th className="py-2 px-3 text-right">Unchecked</th>
                      <th className="py-2 px-3 text-right">Total Conv</th>
                      <th className="py-2 px-3 text-right">EPC</th>
                      <th className="py-2 px-3 text-right">Payout</th>
                    </>
                  )}
                  {activeTab === 'conversions' && (
                    <>
                      <th className="py-2 px-3 text-left">Date</th>
                      <th className="py-2 px-3 text-left">Offer</th>
                      <th className="py-2 px-3 text-left">Network</th>
                      <th className="py-2 px-3 text-left">Publisher</th>
                      <th className="py-2 px-3 text-left">Tx ID</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3 text-right">Gross / Revenue</th>
                      <th className="py-2 px-3 text-right">Payout</th>
                    </>
                  )}
                  {activeTab === 'traffic' && (
                    <>
                      <th className="py-2 px-3 text-left">Date</th>
                      <th className="py-2 px-3 text-left">Offer</th>
                      <th className="py-2 px-3 text-left">Publisher</th>
                      <th className="py-2 px-3 text-left">IP Address</th>
                      <th className="py-2 px-3 text-left">GEO / Device</th>
                      <th className="py-2 px-3 text-center">Conversion</th>
                      <th className="py-2 px-3 text-right">Revenue</th>
                      <th className="py-2 px-3 text-right">Payout</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-border-subtle/80">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-fg-muted">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        <span>Querying live database records...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-fg-subtle italic">
                      No records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row: any, idx) => (
                    <tr key={row.id ?? idx} className="hover:bg-surface-elevated/70 transition-colors">
                      <td className="py-2 px-3 font-mono font-medium text-fg-heading">
                        {row.documentNumber || `DOC-${String(row.id).padStart(4, '0')}`}
                      </td>

                      {activeTab === 'offers' && (
                        <>
                          <td className="py-2 px-3 font-semibold text-fg-heading">{row.name}</td>
                          <td className="py-2 px-3 text-fg-muted">{row.networkName || '-'}</td>
                          <td className="py-2 px-3 text-right text-fg tabular-nums">{row.clicks}</td>
                          <td className="py-2 px-3 text-right font-semibold text-fg tabular-nums">{row.conversions}</td>
                          <td className="py-2 px-3 text-right text-fg tabular-nums">
                            {(row.cr !== undefined ? row.cr : row.clicks > 0 ? (row.conversions / row.clicks) * 100 : 0).toFixed(2)}%
                          </td>
                          <td className="py-2 px-3 text-right text-fg tabular-nums">$ {Number(row.epc || 0).toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-bold text-fg tabular-nums">$ {Number(row.payout || 0).toFixed(2)}</td>
                          <td className="py-2 px-3 text-right text-fg-muted tabular-nums">$ {Number(row.revenue || 0).toFixed(2)}</td>
                        </>
                      )}

                      {activeTab === 'networks' && (
                        <>
                          <td className="py-2 px-3 font-semibold text-fg-heading">{row.name}</td>
                          <td className="py-2 px-3 text-fg-muted">{row.offer || '-'}</td>
                          <td className="py-2 px-3 text-right text-fg tabular-nums">{row.clicks}</td>
                          <td className="py-2 px-3 text-right text-emerald-400 font-medium tabular-nums">
                            {row.conversionsApproved}
                          </td>
                          <td className="py-2 px-3 text-right text-amber-400 tabular-nums">
                            {row.conversionsUnchecked}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-fg tabular-nums">{row.conversionsTotal}</td>
                          <td className="py-2 px-3 text-right font-bold text-fg tabular-nums">$ {Number(row.payout || 0).toFixed(2)}</td>
                          <td className="py-2 px-3 text-right text-fg-muted tabular-nums">$ {Number(row.revenue || 0).toFixed(2)}</td>
                        </>
                      )}

                      {activeTab === 'publishers' && (
                        <>
                          <td className="py-2 px-3 font-semibold text-fg-heading">{row.name}</td>
                          <td className="py-2 px-3 text-fg-muted">{row.offer || '-'}</td>
                          <td className="py-2 px-3 text-right text-fg tabular-nums">{row.clicks}</td>
                          <td className="py-2 px-3 text-right text-emerald-400 font-medium tabular-nums">
                            {row.conversionsApproved}
                          </td>
                          <td className="py-2 px-3 text-right text-amber-400 tabular-nums">
                            {row.conversionsUnchecked}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-fg tabular-nums">{row.conversionsTotal}</td>
                          <td className="py-2 px-3 text-right text-fg tabular-nums">$ {Number(row.epc || 0).toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-bold text-fg tabular-nums">$ {Number(row.payout || 0).toFixed(2)}</td>
                        </>
                      )}

                      {activeTab === 'conversions' && (
                        <>
                          <td className="py-2 px-3 text-fg-muted whitespace-nowrap">
                            {new Date(row.date).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3 font-semibold text-fg-heading">{row.offerName}</td>
                          <td className="py-2 px-3 text-fg-muted">{row.networkName}</td>
                          <td className="py-2 px-3 text-fg-muted">{row.publisherName}</td>
                          <td className="py-2 px-3 font-mono text-[11px] text-fg">{row.externalTxId || '-'}</td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                row.status === 'APPROVED'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : row.status === 'UNCHECKED'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-fg-muted tabular-nums">$ {Number(row.revenue || 0).toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-bold text-fg tabular-nums">$ {Number(row.payout || 0).toFixed(2)}</td>
                        </>
                      )}

                      {activeTab === 'traffic' && (
                        <>
                          <td className="py-2 px-3 text-fg-muted whitespace-nowrap">
                            {new Date(row.date).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3 font-semibold text-fg-heading">{row.offerName}</td>
                          <td className="py-2 px-3 text-fg-muted">{row.publisherName}</td>
                          <td className="py-2 px-3 font-mono text-[11px] text-fg">{row.ipAddress}</td>
                          <td className="py-2 px-3 text-fg-muted">
                            {row.countryCode} · {row.deviceType}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {row.hasConversion ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{row.conversionStatus}</span>
                              </span>
                            ) : (
                              <span className="text-fg-subtle text-[11px]">No Conv</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right text-fg-muted tabular-nums">$ {Number(row.revenue || 0).toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-bold text-fg tabular-nums">$ {Number(row.payout || 0).toFixed(2)}</td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>

              {/* Totals Summary Row with distinct border-t-2 and border-b-2 */}
              {tabRows.length > 0 && (
                <tfoot>
                  <tr className="bg-surface-elevated font-extrabold border-t-2 border-b-2 border-border-strong text-fg-heading">
                    <td
                      colSpan={
                        activeTab === 'offers'
                          ? 3
                          : activeTab === 'networks'
                          ? 3
                          : activeTab === 'publishers'
                          ? 3
                          : 7
                      }
                      className="py-2 px-3 text-xs"
                    >
                      Totals For All {totalRecords} Records
                    </td>
                    {activeTab === 'offers' && (
                      <>
                        <td className="py-2 px-3 text-right tabular-nums">{tableTotals.clicks || 0}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{tableTotals.conversions || 0}</td>
                        <td className="py-2 px-3 text-right">-</td>
                        <td className="py-2 px-3 text-right">-</td>
                        <td className="py-2 px-3 text-right tabular-nums">$ {(tableTotals.payout || 0).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">$ {(tableTotals.revenue || 0).toFixed(2)}</td>
                      </>
                    )}
                    {activeTab === 'networks' && (
                      <>
                        <td className="py-2 px-3 text-right tabular-nums">{tableTotals.clicks || 0}</td>
                        <td className="py-2 px-3 text-right text-emerald-400 tabular-nums">{tableTotals.approved || 0}</td>
                        <td className="py-2 px-3 text-right text-amber-400 tabular-nums">{tableTotals.unchecked || 0}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{tableTotals.totalConv || 0}</td>
                        <td className="py-2 px-3 text-right tabular-nums">$ {(tableTotals.payout || 0).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">$ {(tableTotals.revenue || 0).toFixed(2)}</td>
                      </>
                    )}
                    {activeTab === 'publishers' && (
                      <>
                        <td className="py-2 px-3 text-right tabular-nums">{tableTotals.clicks || 0}</td>
                        <td className="py-2 px-3 text-right text-emerald-400 tabular-nums">{tableTotals.approved || 0}</td>
                        <td className="py-2 px-3 text-right text-amber-400 tabular-nums">{tableTotals.unchecked || 0}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{tableTotals.totalConv || 0}</td>
                        <td className="py-2 px-3 text-right">-</td>
                        <td className="py-2 px-3 text-right tabular-nums">$ {(tableTotals.payout || 0).toFixed(2)}</td>
                      </>
                    )}
                    {activeTab === 'conversions' && (
                      <>
                        <td className="py-2 px-3 text-right tabular-nums">$ {(tableTotals.revenue || 0).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">$ {(tableTotals.payout || 0).toFixed(2)}</td>
                      </>
                    )}
                    {activeTab === 'traffic' && (
                      <>
                        <td className="py-2 px-3 text-right tabular-nums">$ {(tableTotals.revenue || 0).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">$ {(tableTotals.payout || 0).toFixed(2)}</td>
                      </>
                    )}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-3.5 py-1.5 border-t border-border-strong bg-surface-elevated/40 flex flex-wrap items-center justify-between gap-2 text-xs text-fg-muted">
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
                  className="px-2 py-0.5 rounded border border-border-strong bg-surface text-fg focus:outline-hidden"
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
                  className="p-1 rounded border border-border-strong hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded border border-border-strong hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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
