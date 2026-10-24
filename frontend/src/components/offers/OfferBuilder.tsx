import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Copy,
  Plus,
  Minus,
  Search,
  AlertCircle,
  HelpCircle,
  Layers,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Radio,
  Clock,
  ShieldCheck,
  BarChart2,
  BookOpen,
} from 'lucide-react';
import {
  Domain,
  Network,
  Offer,
  OfferVisibility,
  OfferStatus,
  PaymentModel,
} from '../../types';
import {
  createOffer,
  updateOffer,
  duplicateOffer,
  fetchOfferAffiliates,
  assignOfferAffiliate,
  revokeOfferAffiliate,
  fetchPublishers,
} from '../../services/api';
import { Switch } from '../common/Switch';
import { Modal } from '../common/Modal';

export interface OfferBuilderProps {
  offer: Offer | null;
  networks: Network[];
  domains: Domain[];
  onBack: () => void;
  onSuccess: (msg: string) => void;
}

type TabType =
  | 'general'
  | 'tracking'
  | 'targeting'
  | 'affiliates'
  | 'postbacks'
  | 'revenue';

interface MacroItem {
  token: string;
  alias?: string;
  name: string;
  desc: string;
  example: string;
}

const BASE_MACROS: MacroItem[] = [
  {
    token: '{clickid}',
    alias: '{click_id}',
    name: 'Click ID',
    desc: 'Unique tracking token required for S2S Postbacks',
    example: '8f7a2b91-4c3e-4d5a-8b1e-7f6a5b4c3d2e',
  },
  {
    token: '{pid}',
    alias: '{aff_id}',
    name: 'Affiliate ID',
    desc: 'Numeric identifier of the affiliate / publisher',
    example: '104',
  },
  {
    token: '{offer_id}',
    name: 'Offer ID',
    desc: 'Campaign Offer numeric identifier',
    example: '7',
  },
  {
    token: '{ip}',
    name: 'IP-address',
    desc: 'Visitor IPv4 or IPv6 network address',
    example: '192.168.1.1',
  },
  {
    token: '{geo}',
    alias: '{country}',
    name: 'Country code',
    desc: '2-Letter ISO 3166-1 alpha-2 country code',
    example: 'US',
  },
  {
    token: '{city}',
    name: 'City',
    desc: 'Visitor geographic city name',
    example: 'New York',
  },
  {
    token: '{sub1}',
    name: 'Sub Parameter 1',
    desc: 'Custom parameter for traffic source or campaign',
    example: 'facebook_ads',
  },
  {
    token: '{sub2}',
    name: 'Sub Parameter 2',
    desc: 'Custom parameter for ad group or audience',
    example: 'adgroup_05',
  },
  {
    token: '{sub3}',
    name: 'Sub Parameter 3',
    desc: 'Custom parameter for banner or creative ID',
    example: 'banner_blue',
  },
  {
    token: '{sub4}',
    name: 'Sub Parameter 4',
    desc: 'Custom parameter for keyword or placement',
    example: 'feed_top',
  },
  {
    token: '{sub5}',
    name: 'Sub Parameter 5',
    desc: 'Custom parameter for click timestamp or sub-affiliate',
    example: 'subpub_99',
  },
  {
    token: '{deeplink}',
    name: 'Deeplink',
    desc: 'Landing subpath or deep product URL',
    example: '/products/weight-loss-tea',
  },
  {
    token: '{device_ua}',
    name: 'Device User Agent',
    desc: 'Full browser HTTP User-Agent string',
    example: 'Mozilla/5.0 (iPhone; CPU OS 17_0)...',
  },
  {
    token: '{rand}',
    name: 'Unique Number (UUID)',
    desc: 'Random UUID v4 string for cache busting',
    example: '9cdf32d5-124e-4e06-b25b-4c92d3cec9dc',
  },
  {
    token: '{time}',
    name: 'Unix Timestamp',
    desc: 'Time of click committing in Unix epoch seconds',
    example: '1729864200',
  },
  {
    token: '{time_pretty}',
    name: 'Formatted Time',
    desc: 'Time of click in H:i:s 24-hour format',
    example: '14:30:00',
  },
  {
    token: '{date_only}',
    name: 'Formatted Date',
    desc: 'Date of click in Y-M-D format',
    example: '2026-10-25',
  },
];

export function OfferBuilder({
  offer,
  networks,
  domains,
  onBack,
  onSuccess,
}: OfferBuilderProps) {
  const [activeTab, setActiveTab] = useState<TabType>('tracking');

  // Tab 1: General
  const [name, setName] = useState('');
  const [advertiserId, setAdvertiserId] = useState<number>(0);
  const [visibility, setVisibility] = useState<OfferVisibility>('PUBLIC');
  const [status, setStatus] = useState<OfferStatus>('ACTIVE');
  const [previewUrl, setPreviewUrl] = useState('');
  const [description, setDescription] = useState('');

  // Tab 2: Tracking & Controls
  const [domainId, setDomainId] = useState<number | null>(null);
  const [baseDestinationUrl, setBaseDestinationUrl] = useState('');
  const [trafficbackUrl, setTrafficbackUrl] = useState('');
  const [cookieLifetimeDays, setCookieLifetimeDays] = useState<number>(30);
  const [cookieLifetimeUnit, setCookieLifetimeUnit] = useState<'days' | 'hours'>('days');
  const [clickSessionLifespanHours, setClickSessionLifespanHours] = useState<number>(24);
  const [clickSessionLifespanUnit, setClickSessionLifespanUnit] = useState<'hours' | 'days'>('hours');
  const [allowConversionsWithoutSession, setAllowConversionsWithoutSession] = useState<boolean>(false);
  const [enforceIpUniqueness, setEnforceIpUniqueness] = useState<boolean>(false);
  const [blockDuplicateIps, setBlockDuplicateIps] = useState<boolean>(false);

  // Link Check State
  const [linkCheckStatus, setLinkCheckStatus] = useState<{
    tested: boolean;
    valid: boolean;
    message: string;
    previewUrl?: string;
  } | null>(null);

  // Macro Search & Collapse State
  const [macroSearch, setMacroSearch] = useState('');
  const [macroPanelOpen, setMacroPanelOpen] = useState(true);

  // Modals for Explanations
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [showTrafficbackModal, setShowTrafficbackModal] = useState(false);

  // Tab 3: Targeting
  const [targetingName, setTargetingName] = useState('Targeting group #1');
  const [condition, setCondition] = useState<'AND' | 'OR'>('AND');
  const [devices, setDevices] = useState<string[]>(['All']);
  const [countries, setCountries] = useState<string[]>(['United States', 'United Kingdom']);
  const [excludeCountries, setExcludeCountries] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [excludeCities, setExcludeCities] = useState(false);
  const [regions, setRegions] = useState<string[]>([]);
  const [excludeRegions, setExcludeRegions] = useState(false);

  // Tab 4: Affiliates Dual-List
  const [allAffiliates, setAllAffiliates] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [enabledAffiliates, setEnabledAffiliates] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [allAffSearch, setAllAffSearch] = useState('');
  const [enabledAffSearch, setEnabledAffSearch] = useState('');

  // Tab 5: Postbacks
  const [postbackMacroParam, setPostbackMacroParam] = useState('{clickid}');

  // Tab 6: Revenue & Payouts
  const [paymentModel, setPaymentModel] = useState<PaymentModel>('CPA');
  const [currency, setCurrency] = useState('USD');
  const [revenue, setRevenue] = useState<number>(150);
  const [payout, setPayout] = useState<number>(100);

  // Toast / Feedback State
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Initialize or reset form
  useEffect(() => {
    if (offer) {
      setName(offer.name || '');
      setAdvertiserId(offer.advertiserId || (offer as any).networkId || (networks[0]?.id || 0));
      setVisibility(offer.visibility || 'PUBLIC');
      setStatus(offer.status || 'ACTIVE');
      setPreviewUrl(offer.previewUrl || '');
      setDescription(offer.description || '');

      setDomainId(offer.domainId ?? (domains[0]?.id || null));
      setBaseDestinationUrl(offer.baseDestinationUrl || (offer as any).destinationUrl || '');
      setTrafficbackUrl(offer.trafficbackUrl || '');
      setCookieLifetimeDays(offer.cookieLifetimeDays ?? 30);
      setClickSessionLifespanHours(offer.clickSessionLifespanHours ?? 24);
      setAllowConversionsWithoutSession(Boolean(offer.allowConversionsWithoutSession));
      setEnforceIpUniqueness(Boolean(offer.enforceIpUniqueness));
      setBlockDuplicateIps(Boolean(offer.blockDuplicateIps));

      setPostbackMacroParam(offer.postbackMacroParam || '{clickid}');

      const tg = offer.targetingGroups?.[0];
      if (tg) {
        setTargetingName(tg.name || 'Targeting group #1');
        setCondition(tg.condition || 'AND');
        setDevices(tg.devices?.length ? tg.devices : ['All']);
        setCountries(tg.countries?.length ? tg.countries : ['United States']);
        setExcludeCountries(Boolean(tg.excludeCountries));
        setCities(tg.cities || []);
        setExcludeCities(Boolean(tg.excludeCities));
        setRegions(tg.regions || []);
        setExcludeRegions(Boolean(tg.excludeRegions));
      }

      const po = offer.payouts?.[0];
      if (po) {
        setPaymentModel(po.paymentModel || 'CPA');
        setCurrency(po.currency || 'USD');
        setRevenue(Number(po.revenue || 0));
        setPayout(Number(po.payout || 0));
      }

      loadAffiliates(offer.id);
    } else {
      // New Offer Defaults
      setName('');
      setAdvertiserId(networks[0]?.id || 0);
      setVisibility('PUBLIC');
      setStatus('ACTIVE');
      setPreviewUrl('');
      setDescription('');

      setDomainId(domains[0]?.id || null);
      setBaseDestinationUrl('https://example-advertiser.com/landing?aff_id={pid}&click_id={clickid}');
      setTrafficbackUrl('');
      setCookieLifetimeDays(30);
      setCookieLifetimeUnit('days');
      setClickSessionLifespanHours(24);
      setClickSessionLifespanUnit('hours');
      setAllowConversionsWithoutSession(false);
      setEnforceIpUniqueness(false);
      setBlockDuplicateIps(false);

      setPostbackMacroParam('{clickid}');
      setTargetingName('Targeting group #1');
      setCondition('AND');
      setDevices(['All']);
      setCountries(['United States']);
      setExcludeCountries(false);
      setCities([]);
      setExcludeCities(false);
      setRegions([]);
      setExcludeRegions(false);

      setPaymentModel('CPA');
      setCurrency('USD');
      setRevenue(150);
      setPayout(100);

      loadAllPublishersForNew();
    }

    setFieldErrors({});
    setLinkCheckStatus(null);
  }, [offer, networks, domains]);

  const loadAffiliates = async (offerId: number) => {
    try {
      const dualList = await fetchOfferAffiliates(offerId);
      setAllAffiliates(dualList.allAffiliates || []);
      setEnabledAffiliates(dualList.enabledAffiliates || []);
    } catch (err) {
      console.error('Failed to load offer affiliates', err);
    }
  };

  const loadAllPublishersForNew = async () => {
    try {
      const pubs = await fetchPublishers();
      setAllAffiliates(
        pubs
          .filter((p) => p.status === 'ACTIVE')
          .map((p) => ({ id: p.id, name: p.name, email: p.email }))
      );
      setEnabledAffiliates([]);
    } catch (err) {
      console.error('Failed to load publishers', err);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(label);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleAppendMacro = (token: string) => {
    setBaseDestinationUrl((prev) => {
      if (!prev) return `https://example.com/?param=${token}`;
      if (prev.includes(token)) return prev;
      const delimiter = prev.includes('?') ? '&' : '?';
      // Pick clean param key based on token
      const cleanKey = token.replace(/[{}]/g, '');
      return `${prev}${delimiter}${cleanKey}=${token}`;
    });
    setCopiedToken(`Added ${token} to URL ✓`);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCheckLink = () => {
    if (!baseDestinationUrl.trim()) {
      setLinkCheckStatus({
        tested: true,
        valid: false,
        message: 'Base Destination URL is empty. Please enter a destination URL first.',
      });
      return;
    }

    try {
      const parsedUrl = new URL(baseDestinationUrl);
      const hasHttp = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
      const hasClickId =
        baseDestinationUrl.includes('{clickid}') ||
        baseDestinationUrl.includes('{click_id}');

      // Create test simulated URL by replacing tokens with mock values
      const testPreview = baseDestinationUrl
        .replace(/\{clickid\}|\{click_id\}/g, 'sim_clk_9f82d1')
        .replace(/\{pid\}|\{aff_id\}/g, '104')
        .replace(/\{offer_id\}/g, offer?.id ? String(offer.id) : '7')
        .replace(/\{sub1\}/g, 'google_ads')
        .replace(/\{geo\}|\{country\}/g, 'US');

      if (!hasHttp) {
        setLinkCheckStatus({
          tested: true,
          valid: false,
          message: 'URL must start with http:// or https:// protocol.',
        });
        return;
      }

      if (!hasClickId) {
        setLinkCheckStatus({
          tested: true,
          valid: false,
          message:
            '⚠️ Warning: Missing {clickid} or {click_id} macro. S2S attribution postback requires a click ID macro to attribute conversions.',
          previewUrl: testPreview,
        });
        return;
      }

      setLinkCheckStatus({
        tested: true,
        valid: true,
        message:
          '✓ Valid Destination URL format. {clickid} parameter detected and ready for S2S attribution routing.',
        previewUrl: testPreview,
      });
    } catch {
      setLinkCheckStatus({
        tested: true,
        valid: false,
        message: 'Invalid URL structure. Please enter a valid RFC-compliant URL.',
      });
    }
  };

  const handleToggleDevice = (dev: string) => {
    if (dev === 'All') {
      setDevices(['All']);
      return;
    }
    let updated = devices.filter((d) => d !== 'All');
    if (updated.includes(dev)) {
      updated = updated.filter((d) => d !== dev);
      if (updated.length === 0) updated = ['All'];
    } else {
      updated.push(dev);
    }
    setDevices(updated);
  };

  const handleAssignAffiliate = async (pub: { id: number; name: string; email: string }) => {
    if (offer?.id) {
      try {
        await assignOfferAffiliate(offer.id, pub.id);
      } catch (err: any) {
        alert(err.message || 'Failed to assign affiliate');
        return;
      }
    }
    setAllAffiliates((prev) => prev.filter((a) => a.id !== pub.id));
    setEnabledAffiliates((prev) => [...prev, pub]);
    setCopiedToken(`Enabled ${pub.name}`);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  const handleRevokeAffiliate = async (pub: { id: number; name: string; email: string }) => {
    if (offer?.id) {
      try {
        await revokeOfferAffiliate(offer.id, pub.id);
      } catch (err: any) {
        alert(err.message || 'Failed to revoke affiliate');
        return;
      }
    }
    setEnabledAffiliates((prev) => prev.filter((a) => a.id !== pub.id));
    setAllAffiliates((prev) => [...prev, pub]);
    setCopiedToken(`Revoked ${pub.name}`);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  // Profit Margin Spread Calculation
  const netProfit = Number((revenue - payout).toFixed(2));
  const profitMarginPct = revenue > 0 ? Number(((netProfit / revenue) * 100).toFixed(1)) : 0;

  // Selected Domain Name
  const selectedDomainObj = domains.find((d) => d.id === domainId) || domains[0];
  const domainHost = selectedDomainObj?.name || 'zshe.panel.7tracking.com';
  const globalPostbackUrl = `https://${domainHost}/api/v1/postback?clickid=${postbackMacroParam}`;

  const handleSave = async (andContinue: boolean = false) => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Please fill out this field.';
    if (!advertiserId) errors.advertiserId = 'Please select an advertiser.';
    if (!baseDestinationUrl.trim()) errors.baseDestinationUrl = 'Please fill out this field.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.name || errors.advertiserId) setActiveTab('general');
      else if (errors.baseDestinationUrl) setActiveTab('tracking');
      return;
    }

    try {
      setIsSubmitting(true);
      setFieldErrors({});

      const computedCookieDays =
        cookieLifetimeUnit === 'hours'
          ? Math.max(1, Math.round(cookieLifetimeDays / 24))
          : cookieLifetimeDays;
      const computedClickLifespanHours =
        clickSessionLifespanUnit === 'days'
          ? clickSessionLifespanHours * 24
          : clickSessionLifespanHours;

      const payload = {
        general: {
          name,
          networkId: advertiserId,
          visibility,
          status,
          previewUrl: previewUrl || undefined,
          description: description || undefined,
        },
        tracking: {
          domainId: domainId || null,
          destinationUrl: baseDestinationUrl,
          trafficbackUrl: trafficbackUrl.trim() || null,
          cookieLifetimeDays: computedCookieDays,
          clickSessionLifespanHours: computedClickLifespanHours,
          allowConversionsWithoutSession,
          enforceIpUniqueness,
          blockDuplicateIps,
        },
        targeting: {
          name: targetingName,
          conditionOp: condition,
          isEnabled: true,
          devices: devices.length ? devices : ['ALL'],
          countries: countries.length ? countries : ['ALL'],
          excludeCountries,
          cities,
          excludeCities,
          regions,
          excludeRegions,
        },
        affiliates: {
          enabledPublisherIds: enabledAffiliates.map((a) => a.id),
        },
        revenuePayouts: {
          title: 'Default',
          goalValue: '1',
          paymentModel: paymentModel === 'CPA' ? 'CPA_FIXED' : paymentModel,
          currency,
          revenue: Number(revenue),
          payout: Number(payout),
        },
        // Flat aliases for backwards compatibility:
        name,
        advertiserId,
        networkId: advertiserId,
        domainId,
        visibility,
        status,
        previewUrl,
        description,
        baseDestinationUrl,
        destinationUrl: baseDestinationUrl,
        trafficbackUrl: trafficbackUrl.trim() || null,
        cookieLifetimeDays: computedCookieDays,
        clickSessionLifespanHours: computedClickLifespanHours,
        allowConversionsWithoutSession,
        enforceIpUniqueness,
        blockDuplicateIps,
      };

      if (offer?.id) {
        await updateOffer(offer.id, payload);
        onSuccess('Offer updated successfully!');
      } else {
        await createOffer(payload);
        onSuccess('Offer created successfully!');
      }

      if (!andContinue) {
        onBack();
      } else {
        setCopiedToken('All changes saved successfully ✓');
        setTimeout(() => setCopiedToken(null), 2500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!offer?.id) return;
    try {
      setIsSubmitting(true);
      await duplicateOffer(offer.id);
      onSuccess('Offer duplicated successfully!');
      onBack();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Macros for Table-First Dictionary (DOD Rule #2)
  const filteredMacros = BASE_MACROS.filter((m) => {
    const q = macroSearch.toLowerCase();
    return (
      m.token.toLowerCase().includes(q) ||
      (m.alias && m.alias.toLowerCase().includes(q)) ||
      m.name.toLowerCase().includes(q) ||
      m.desc.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full space-y-6 pb-24 animate-fadeIn">
      {/* Toast Feedback */}
      {copiedToken && (
        <div className="fixed bottom-20 right-8 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{copiedToken}</span>
        </div>
      )}

      {/* Top Header Bar with Breadcrumb and Actions */}
      <div className="panel-card p-5 border border-border-subtle bg-surface shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-lg border border-border-subtle hover:bg-surface-elevated text-fg-muted hover:text-fg transition flex items-center gap-1.5 text-xs font-medium"
              title="Return to Offers Table"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Offers</span>
            </button>
            <div className="h-6 w-px bg-border-subtle hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-fg">
                  {offer ? `Edit Offer: ${offer.name} (#${offer.id})` : 'New Offer Setup'}
                </h1>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : status === 'PAUSED'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="text-xs text-fg-muted mt-0.5">
                Configure campaign routing, tracking parameters, targeting rules, affiliate access, and revenue payouts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHowItWorksModal(true)}
              className="px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-surface-elevated text-xs font-semibold text-fg-muted hover:text-fg flex items-center gap-1.5 transition"
            >
              <BookOpen className="w-4 h-4 text-primary" />
              <span>How it works</span>
            </button>
            {offer?.id && (
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-surface-elevated text-xs font-semibold text-fg flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Layers className="w-4 h-4 text-sky-500" />
                <span>Duplicate offer</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabbed Navigation Bar (Separate Config UIs per DOD Rule #3) */}
      <div className="panel-card px-4 pt-1 pb-0 border border-border-subtle bg-surface">
        <div className="flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          {[
            { id: 'general', label: 'General', icon: Layers },
            { id: 'tracking', label: 'Tracking & Controls', icon: Globe },
            { id: 'targeting', label: 'Targeting', icon: Radio },
            { id: 'affiliates', label: 'Affiliates', icon: ShieldCheck },
            { id: 'postbacks', label: 'Postbacks', icon: Clock },
            { id: 'revenue', label: 'Revenue & Payouts', icon: BarChart2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-3 px-4 border-b-2 font-semibold transition whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-fg-muted hover:text-fg'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-fg-muted'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB BODY AREA */}
      <div className="space-y-6">
        {/* ============================================================== */}
        {/* TAB 1: GENERAL */}
        {/* ============================================================== */}
        {activeTab === 'general' && (
          <div className="panel-card p-6 border border-border-subtle bg-surface space-y-6 max-w-4xl">
            <h2 className="text-base font-bold text-fg border-b border-border-subtle pb-3">
              Core Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-fg-muted mb-1 text-xs">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Layvaris Keto"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                  }}
                  className={`w-full bg-surface-elevated border ${
                    fieldErrors.name ? 'border-danger' : 'border-border-subtle'
                  } text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary`}
                />
                {fieldErrors.name && (
                  <p className="text-[11px] text-danger mt-1">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-fg-muted mb-1 text-xs">
                  Advertiser (Network) <span className="text-danger">*</span>
                </label>
                <select
                  value={advertiserId}
                  onChange={(e) => {
                    setAdvertiserId(Number(e.target.value));
                    if (fieldErrors.advertiserId)
                      setFieldErrors({ ...fieldErrors, advertiserId: '' });
                  }}
                  className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                >
                  <option value={0}>Select Advertiser...</option>
                  {networks.map((net) => (
                    <option key={net.id} value={net.id}>
                      {net.name} {net.contactDetails ? `(${net.contactDetails})` : ''}
                    </option>
                  ))}
                </select>
                {fieldErrors.advertiserId && (
                  <p className="text-[11px] text-danger mt-1">{fieldErrors.advertiserId}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-fg-muted mb-1 text-xs">
                    Visibility <span className="text-danger">*</span>
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as OfferVisibility)}
                    className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="PUBLIC">Public (Available to all)</option>
                    <option value="PRIVATE">Private (Assigned in Affiliates tab)</option>
                    <option value="REQUIRES_APPROVAL">Requires approval</option>
                  </select>
                  {visibility === 'REQUIRES_APPROVAL' && (
                    <p className="text-[11px] text-amber-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Affiliates must manually request access before getting link
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-fg-muted mb-1 text-xs">
                    Status <span className="text-danger">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OfferStatus)}
                    className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-fg-muted mb-1 text-xs">Preview URL</label>
                <input
                  type="url"
                  placeholder="https://landingpage-preview.com"
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                  className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-fg-muted mb-1 text-xs">Description</label>
                <textarea
                  rows={4}
                  placeholder="Campaign restrictions, conversion conditions, and instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: TRACKING & CONTROLS (Full Body 2-Column Enterprise Layout) */}
        {/* ============================================================== */}
        {activeTab === 'tracking' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Core Settings + Validation Period (8 cols on lg) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {/* Card 1: Core Settings */}
              <div className="panel-card p-6 border border-border-subtle bg-surface space-y-5">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div>
                    <h2 className="text-base font-bold text-fg">Core Settings</h2>
                    <p className="text-xs text-fg-muted">
                      Specify the tracking domain, advertiser base destination URL, and fallback redirect
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHowItWorksModal(true)}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>How it works</span>
                  </button>
                </div>

                {/* Tracking Domain */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-fg-muted text-xs">
                      Select Tracking Domain
                    </label>
                    {domainId !== null && (
                      <button
                        type="button"
                        onClick={() => setDomainId(null)}
                        className="text-[11px] text-fg-muted hover:text-danger flex items-center gap-0.5 transition"
                        title="Clear tracking domain selection"
                      >
                        <span>Reset to default</span>
                        <span>✕</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={domainId ?? ''}
                    onChange={(e) => setDomainId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-primary"
                  >
                    {domains.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.status})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-fg-muted mt-1.5">
                    Choose which tracking domain should be used to generate affiliate links for this offer.
                  </p>
                </div>

                {/* Base Destination URL */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-fg-muted text-xs">
                      Base Destination URL <span className="text-danger">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopy(baseDestinationUrl, 'Base URL copied to clipboard ✓')}
                      className="text-primary hover:underline flex items-center gap-1 text-[11px] font-medium"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="https://buylyvaris.com/slim/health/?affId=FC588AFC&c1={pid}&c2={sub1}&c3={click_id}"
                    value={baseDestinationUrl}
                    onChange={(e) => {
                      setBaseDestinationUrl(e.target.value);
                      if (fieldErrors.baseDestinationUrl)
                        setFieldErrors({ ...fieldErrors, baseDestinationUrl: '' });
                      if (linkCheckStatus) setLinkCheckStatus(null);
                    }}
                    className={`w-full bg-surface-elevated border ${
                      fieldErrors.baseDestinationUrl ? 'border-danger' : 'border-border-subtle'
                    } text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary font-mono text-[11px] leading-relaxed`}
                  />
                  {fieldErrors.baseDestinationUrl && (
                    <p className="text-[11px] text-danger mt-1">{fieldErrors.baseDestinationUrl}</p>
                  )}
                  <p className="text-[11px] text-fg-muted mt-1">
                    Enter the advertiser's tracking link here. Use macro tokens like <code className="text-primary font-mono font-bold">{'{clickid}'}</code> to forward click session identifiers.
                  </p>

                  {/* Check link interactive action */}
                  <div className="mt-2.5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCheckLink}
                      className="px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Check link</span>
                    </button>
                    {linkCheckStatus && (
                      <div
                        className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                          linkCheckStatus.valid
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}
                      >
                        <span>{linkCheckStatus.message}</span>
                        {linkCheckStatus.previewUrl && (
                          <a
                            href={linkCheckStatus.previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold underline inline-flex items-center gap-0.5 ml-1"
                          >
                            <span>Preview ↗</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Trafficback URL */}
                <div className="pt-2 border-t border-border-subtle">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-fg-muted text-xs">
                      Trafficback URL
                    </label>
                    <div className="flex items-center gap-3">
                      {trafficbackUrl && (
                        <button
                          type="button"
                          onClick={() => handleCopy(trafficbackUrl, 'Trafficback URL copied ✓')}
                          className="text-primary hover:underline flex items-center gap-1 text-[11px] font-medium"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowTrafficbackModal(true)}
                        className="text-primary hover:underline flex items-center gap-1 text-[11px] font-medium"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>How to use it?</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type="url"
                    placeholder="https://global-fallback-rotator.com/redirect?source={pid}"
                    value={trafficbackUrl}
                    onChange={(e) => setTrafficbackUrl(e.target.value)}
                    className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary font-mono text-[11px]"
                  />
                  <p className="text-[11px] text-fg-muted mt-1.5">
                    Enter a URL to redirect users to if the offer is inactive or the user doesn't meet targeting criteria. Prevents traffic leakage and monetizes disqualified visitors.
                  </p>
                </div>

                {/* Toggles: Enforce IP Uniqueness & Block Duplicate IPs */}
                <div className="pt-3 border-t border-border-subtle space-y-4">
                  <Switch
                    label="Enforce IP uniqueness"
                    description="Mark conversions with the same IP in statistics with the 'Duplicate IP' comment for fraud review."
                    checked={enforceIpUniqueness}
                    onChange={setEnforceIpUniqueness}
                  />

                  <Switch
                    label="Block duplicate IPs"
                    description="Prevents multiple orders from the same IP within the chosen window. Helps reduce duplicate/fraud, but may suppress legit repeat buyers on shared networks."
                    checked={blockDuplicateIps}
                    onChange={setBlockDuplicateIps}
                  />
                </div>
              </div>

              {/* Card 2: Validation Period & Cookie Window */}
              <div className="panel-card p-6 border border-border-subtle bg-surface space-y-5">
                <div className="border-b border-border-subtle pb-3">
                  <h2 className="text-base font-bold text-fg">Validation Period & Cookie Window</h2>
                  <p className="text-xs text-fg-muted">
                    Configure attribution lifetime, session durations, and conversion matching policies
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Cookie Lifetime / Attribution Window */}
                  <div>
                    <label className="block font-semibold text-fg-muted mb-1 text-xs">
                      Cookie Lifetime (Attribution Window)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={cookieLifetimeDays}
                        onChange={(e) => setCookieLifetimeDays(Number(e.target.value))}
                        className="w-2/3 bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                      />
                      <select
                        value={cookieLifetimeUnit}
                        onChange={(e) => setCookieLifetimeUnit(e.target.value as 'days' | 'hours')}
                        className="w-1/3 bg-surface-elevated border border-border-subtle text-fg rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-primary"
                      >
                        <option value="days">Days</option>
                        <option value="hours">Hours</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-fg-muted mt-1.5">
                      Conversions occurring within this timeframe after click will be attributed to the affiliate.
                    </p>
                  </div>

                  {/* Click Session Lifespan */}
                  <div>
                    <label className="block font-semibold text-fg-muted mb-1 text-xs">
                      Click Session Lifespan
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={720}
                        value={clickSessionLifespanHours}
                        onChange={(e) => setClickSessionLifespanHours(Number(e.target.value))}
                        className="w-2/3 bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                      />
                      <select
                        value={clickSessionLifespanUnit}
                        onChange={(e) => setClickSessionLifespanUnit(e.target.value as 'hours' | 'days')}
                        className="w-1/3 bg-surface-elevated border border-border-subtle text-fg rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-primary"
                      >
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-fg-muted mt-1.5">
                      How long a click session token remains active before a new click session is required.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-subtle">
                  <Switch
                    label="Allow conversions without click session"
                    description="Accept postback conversions even when no active click session is found (fallback attribution to offer master account)."
                    checked={allowConversionsWithoutSession}
                    onChange={setAllowConversionsWithoutSession}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Table-First Base Destination URL Macros (4-5 cols on lg) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              <div className="panel-card p-5 border border-border-subtle bg-surface sticky top-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-fg">
                      Base Destination URL Macros
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMacroPanelOpen(!macroPanelOpen)}
                    className="text-fg-muted hover:text-fg p-1 rounded transition"
                  >
                    {macroPanelOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {macroPanelOpen && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-fg-muted leading-relaxed">
                      Click any macro to instantly append it to your Base Destination URL, or copy to clipboard:
                    </p>

                    {/* Search input for Macros */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-fg-muted" />
                      <input
                        type="text"
                        placeholder="Search macros (e.g. clickid, ip, sub)..."
                        value={macroSearch}
                        onChange={(e) => setMacroSearch(e.target.value)}
                        className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Table-First Macro Dictionary per DOD Rule #2 */}
                    <div className="max-h-[520px] overflow-y-auto rounded-lg border border-border-subtle pr-1">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-surface-elevated/70 sticky top-0 z-10 text-[10px] uppercase font-bold text-fg-muted tracking-wider border-b border-border-subtle">
                          <tr>
                            <th className="py-2 px-2.5">Macro Token</th>
                            <th className="py-2 px-2">Description</th>
                            <th className="py-2 px-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle text-[11px]">
                          {filteredMacros.map((m) => {
                            const isAlreadyInUrl =
                              baseDestinationUrl.includes(m.token) ||
                              Boolean(m.alias && baseDestinationUrl.includes(m.alias));

                            return (
                              <tr
                                key={m.token}
                                className="hover:bg-surface-elevated/40 transition group"
                              >
                                <td className="py-2 px-2.5 font-mono align-top">
                                  <div className="font-bold text-primary">
                                    {m.token}
                                  </div>
                                  {m.alias && (
                                    <div className="text-[10px] text-fg-muted">
                                      or {m.alias}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 px-2 align-top">
                                  <div className="font-semibold text-fg">{m.name}</div>
                                  <div className="text-[10px] text-fg-muted line-clamp-2">
                                    {m.desc}
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-right align-top whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {isAlreadyInUrl ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                                        In URL ✓
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleAppendMacro(m.token)}
                                        className="px-2 py-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-[10px] font-semibold transition active:scale-95"
                                        title={`Append ${m.token} to URL`}
                                      >
                                        + Add
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(m.token, `Copied ${m.token} ✓`)}
                                      className="p-1 rounded text-fg-muted hover:text-fg hover:bg-surface-elevated transition"
                                      title={`Copy ${m.token}`}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {filteredMacros.length === 0 && (
                            <tr>
                              <td colSpan={3} className="py-6 text-center text-fg-muted text-xs">
                                No macros match "{macroSearch}"
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: TARGETING */}
        {/* ============================================================== */}
        {activeTab === 'targeting' && (
          <div className="panel-card p-6 border border-border-subtle bg-surface space-y-5 max-w-4xl">
            <h2 className="text-base font-bold text-fg border-b border-border-subtle pb-3">
              Targeting Rules & Geo Filters
            </h2>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-fg-muted mb-1">
                  Targeting Group Name
                </label>
                <input
                  type="text"
                  value={targetingName}
                  onChange={(e) => setTargetingName(e.target.value)}
                  className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-fg-muted mb-1">Rule Condition</label>
                <div className="inline-flex rounded-lg border border-border-subtle p-0.5 bg-surface-elevated">
                  <button
                    type="button"
                    onClick={() => setCondition('AND')}
                    className={`px-4 py-1.5 rounded-md font-semibold text-xs transition ${
                      condition === 'AND'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-fg-muted hover:text-fg'
                    }`}
                  >
                    AND
                  </button>
                  <button
                    type="button"
                    onClick={() => setCondition('OR')}
                    className={`px-4 py-1.5 rounded-md font-semibold text-xs transition ${
                      condition === 'OR'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-fg-muted hover:text-fg'
                    }`}
                  >
                    OR
                  </button>
                </div>
              </div>

              {/* Devices Multi-Select */}
              <div>
                <label className="block font-semibold text-fg-muted mb-1">Devices</label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'PC', 'Android', 'iOS', 'Tablet'].map((dev) => {
                    const isSelected = devices.includes(dev);
                    return (
                      <button
                        key={dev}
                        type="button"
                        onClick={() => handleToggleDevice(dev)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                          isSelected
                            ? 'bg-primary border-primary text-white'
                            : 'bg-surface-elevated border-border-subtle text-fg-muted hover:text-fg'
                        }`}
                      >
                        {dev}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Countries */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-fg-muted">Countries</label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={excludeCountries}
                      onChange={(e) => setExcludeCountries(e.target.checked)}
                      className="rounded border-border-subtle text-danger"
                    />
                    <span className="text-danger font-semibold">Exclude</span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France'].map(
                    (country) => {
                      const isSelected = countries.includes(country);
                      return (
                        <button
                          key={country}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setCountries(countries.filter((c) => c !== country));
                            } else {
                              setCountries([...countries, country]);
                            }
                          }}
                          className={`px-3 py-1 rounded-lg border text-xs font-medium transition ${
                            isSelected
                              ? 'bg-primary border-primary text-white'
                              : 'bg-surface-elevated border-border-subtle text-fg-muted hover:text-fg'
                          }`}
                        >
                          {country}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: AFFILIATES (DUAL-LIST ASSIGNMENT) */}
        {/* ============================================================== */}
        {activeTab === 'affiliates' && (
          <div className="panel-card p-6 border border-border-subtle bg-surface space-y-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h2 className="text-base font-bold text-fg">Dual-List Affiliate Assignment</h2>
                <p className="text-xs text-fg-muted">
                  Assign specific publishers to this offer. Click (+) to enable, (-) to revoke.
                </p>
              </div>
              {copiedToken && (
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                  {copiedToken}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Card: All Affiliates */}
              <div className="panel-card p-4 border border-border-subtle bg-surface-elevated/30 flex flex-col h-96">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-fg-muted">
                    All Affiliates ({allAffiliates.length})
                  </span>
                </div>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-fg-muted" />
                  <input
                    type="text"
                    placeholder="Search publisher..."
                    value={allAffSearch}
                    onChange={(e) => setAllAffSearch(e.target.value)}
                    className="w-full bg-surface border border-border-subtle text-fg rounded pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {allAffiliates
                    .filter((a) =>
                      `${a.name} ${a.email} ${a.id}`
                        .toLowerCase()
                        .includes(allAffSearch.toLowerCase())
                    )
                    .map((aff) => (
                      <div
                        key={aff.id}
                        className="flex items-center justify-between p-2 rounded bg-surface border border-border-subtle hover:border-primary/40 transition"
                      >
                        <div className="truncate">
                          <span className="font-bold text-primary mr-1.5">#{aff.id}</span>
                          <span className="font-semibold text-fg">{aff.name}</span>
                          <div className="text-[11px] text-fg-muted font-mono truncate">
                            {aff.email}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAssignAffiliate(aff)}
                          className="w-7 h-7 rounded bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center transition shadow-sm flex-shrink-0"
                          title="Assign to offer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  {allAffiliates.length === 0 && (
                    <div className="h-full flex items-center justify-center text-fg-muted text-xs">
                      All publishers are enabled
                    </div>
                  )}
                </div>
              </div>

              {/* Right Card: Enabled Affiliates */}
              <div className="panel-card p-4 border border-border-subtle bg-surface-elevated/30 flex flex-col h-96">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-emerald-500">
                    Enabled Affiliates ({enabledAffiliates.length})
                  </span>
                </div>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-fg-muted" />
                  <input
                    type="text"
                    placeholder="Search enabled..."
                    value={enabledAffSearch}
                    onChange={(e) => setEnabledAffSearch(e.target.value)}
                    className="w-full bg-surface border border-border-subtle text-fg rounded pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {enabledAffiliates
                    .filter((a) =>
                      `${a.name} ${a.email} ${a.id}`
                        .toLowerCase()
                        .includes(enabledAffSearch.toLowerCase())
                    )
                    .map((aff) => (
                      <div
                        key={aff.id}
                        className="flex items-center justify-between p-2 rounded bg-surface border border-emerald-500/30 transition"
                      >
                        <div className="truncate">
                          <span className="font-bold text-emerald-500 mr-1.5">#{aff.id}</span>
                          <span className="font-semibold text-fg">{aff.name}</span>
                          <div className="text-[11px] text-fg-muted font-mono truncate">
                            {aff.email}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRevokeAffiliate(aff)}
                          className="w-7 h-7 rounded bg-danger hover:bg-red-700 active:scale-95 text-white flex items-center justify-center transition shadow-sm flex-shrink-0"
                          title="Revoke from offer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  {enabledAffiliates.length === 0 && (
                    <div className="h-full flex items-center justify-center text-fg-muted text-xs">
                      No publishers assigned yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: POSTBACKS */}
        {/* ============================================================== */}
        {activeTab === 'postbacks' && (
          <div className="panel-card p-6 border border-border-subtle bg-surface space-y-5 max-w-4xl">
            <h2 className="text-base font-bold text-fg border-b border-border-subtle pb-3">
              Postback Integration & Pixels
            </h2>
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-fg-muted">Global S2S Postback URL</label>
                  <button
                    type="button"
                    onClick={() => handleCopy(globalPostbackUrl, 'Postback URL copied ✓')}
                    className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={globalPostbackUrl}
                  className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 font-mono text-[11px] select-all"
                />
                <p className="text-[11px] text-fg-muted mt-1">
                  Provide this link to the Advertiser. When a conversion triggers on their end,
                  they must call this URL with the clickid parameter.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-fg-muted mb-1">
                  Advertiser Click ID Macro
                </label>
                <input
                  type="text"
                  value={postbackMacroParam}
                  onChange={(e) => setPostbackMacroParam(e.target.value)}
                  placeholder="e.g. {clickid}, {s2}, or {click_id}"
                  className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-border-subtle">
                <div>
                  <label className="block font-semibold text-fg-muted mb-1">
                    HTML Image Pixel (Fallback)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`<img src="${globalPostbackUrl}" width="1" height="1" />`}
                    className="w-full bg-surface-elevated border border-border-subtle text-fg-muted rounded-lg px-3 py-2 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-fg-muted mb-1">
                    HTML Iframe Pixel (Fallback)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`<iframe src="${globalPostbackUrl}" scrolling="no" frameborder="0" width="1" height="1"></iframe>`}
                    className="w-full bg-surface-elevated border border-border-subtle text-fg-muted rounded-lg px-3 py-2 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: REVENUE & PAYOUTS */}
        {/* ============================================================== */}
        {activeTab === 'revenue' && (
          <div className="panel-card p-6 border border-border-subtle bg-surface space-y-5 max-w-4xl">
            <h2 className="text-base font-bold text-fg border-b border-border-subtle pb-3">
              Revenue & Payout Spread Settings
            </h2>
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-fg-muted mb-1">Payment Model</label>
                  <select
                    value={paymentModel}
                    onChange={(e) => setPaymentModel(e.target.value as PaymentModel)}
                    className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  >
                    <option value="CPA">CPA (Cost Per Action)</option>
                    <option value="CPC">CPC (Cost Per Click)</option>
                    <option value="CPM">CPM (Cost Per Mille)</option>
                    <option value="REVSHARE">RevShare (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-fg-muted mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="PKR">PKR (₨)</option>
                    <option value="AED">AED (د.إ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-fg-muted mb-1">
                    Advertiser Revenue ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={revenue}
                    onChange={(e) => setRevenue(Number(e.target.value))}
                    className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-fg-muted mb-1">
                    Affiliate Payout ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={payout}
                    onChange={(e) => setPayout(Number(e.target.value))}
                    className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Live Profit Spread Badge */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-between">
                <div>
                  <div className="font-bold text-fg">Computed Spread / Net Margin</div>
                  <div className="text-xs text-fg-muted">
                    Revenue: ${revenue.toFixed(2)} - Payout: ${payout.toFixed(2)}
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-lg font-bold text-sm ${
                    netProfit >= 0
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                      : 'bg-danger/10 text-danger border border-danger/30'
                  }`}
                >
                  Net Margin: ${netProfit.toFixed(2)} ({profitMarginPct}%)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border-subtle px-6 py-3.5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {offer?.id && (
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-elevated text-fg font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Layers className="w-3.5 h-3.5 text-sky-500" />
                <span>Duplicate offer</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-elevated text-fg font-medium transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10 font-semibold transition"
            >
              Save & continue
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover active:scale-95 text-white font-semibold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS MODAL */}
      <Modal
        isOpen={showHowItWorksModal}
        onClose={() => setShowHowItWorksModal(false)}
        title="How Tracking & Controls Work"
      >
        <div className="space-y-4 text-xs text-fg leading-relaxed">
          <p>
            The <strong>Tracking & Controls</strong> engine manages the lifecycle of incoming visitor clicks, redirection to the advertiser, and attribution of conversions:
          </p>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-surface-elevated border border-border-subtle">
              <div className="font-bold text-primary mb-1">1. Tracking Domain</div>
              <p className="text-fg-muted">
                Affiliates promote links under your dedicated tracking domain. The engine logs the click, generates a unique session token, and resolves the campaign.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-surface-elevated border border-border-subtle">
              <div className="font-bold text-primary mb-1">2. Base Destination URL & Macros</div>
              <p className="text-fg-muted">
                The visitor is forwarded to the advertiser's landing page. The engine substitutes macro tokens like <code className="text-primary font-mono">{'{clickid}'}</code> and <code className="text-primary font-mono">{'{pid}'}</code> with live session parameters.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-surface-elevated border border-border-subtle">
              <div className="font-bold text-primary mb-1">3. Trafficback Redirection</div>
              <p className="text-fg-muted">
                If the campaign is paused or targeting criteria fail (wrong country, wrong device, or duplicate IP), traffic is routed to the Trafficback URL instead of showing an error.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-surface-elevated border border-border-subtle">
              <div className="font-bold text-primary mb-1">4. Validation Period & Cookie Window</div>
              <p className="text-fg-muted">
                Defines the attribution window (e.g. 30 days) and click session lifespan (e.g. 24 hours) during which advertiser postbacks will be credited to the original affiliate.
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowHowItWorksModal(false)}
              className="px-4 py-2 rounded-lg bg-primary text-white font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>

      {/* TRAFFICBACK URL GUIDE MODAL */}
      <Modal
        isOpen={showTrafficbackModal}
        onClose={() => setShowTrafficbackModal(false)}
        title="How to Use Trafficback URL"
      >
        <div className="space-y-4 text-xs text-fg leading-relaxed">
          <p>
            <strong>Trafficback URL</strong> prevents lost revenue by monetizing disqualified or rejected traffic.
          </p>
          <div className="p-3 rounded-lg bg-surface-elevated border border-border-subtle space-y-2">
            <div className="font-bold text-primary">When is Trafficback triggered?</div>
            <ul className="list-disc list-inside text-fg-muted space-y-1">
              <li>Offer status is PAUSED or DISABLED.</li>
              <li>Visitor's country, city, or region does not match Targeting rules.</li>
              <li>Visitor device or OS is unsupported.</li>
              <li>Duplicate IP detected when "Block duplicate IPs" is enabled.</li>
              <li>Campaign daily or total conversion cap is reached.</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-surface-elevated border border-border-subtle space-y-1">
            <div className="font-bold text-emerald-500">Recommended Best Practice:</div>
            <p className="text-fg-muted">
              Use a global fallback smartlink or rotator URL such as:
              <br />
              <code className="text-primary font-mono text-[11px] block mt-1 bg-surface p-1.5 rounded border border-border-subtle">
                https://fallback-smartlink.com/traffic?source={'{pid}'}&c1={'{sub1}'}
              </code>
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowTrafficbackModal(false)}
              className="px-4 py-2 rounded-lg bg-primary text-white font-semibold"
            >
              Understood
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
