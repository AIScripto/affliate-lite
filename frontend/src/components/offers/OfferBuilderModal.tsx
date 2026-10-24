import { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Plus,
  Minus,
  Search,
  AlertCircle,
  HelpCircle,
  Layers,
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

interface OfferBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: Offer | null;
  networks: Network[];
  domains: Domain[];
  onSuccess: (msg: string) => void;
}

type TabType =
  | 'general'
  | 'tracking'
  | 'targeting'
  | 'affiliates'
  | 'postbacks'
  | 'revenue';

export function OfferBuilderModal({
  isOpen,
  onClose,
  offer,
  networks,
  domains,
  onSuccess,
}: OfferBuilderModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general');

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
  const [enforceIpUniqueness, setEnforceIpUniqueness] = useState(false);
  const [blockDuplicateIps, setBlockDuplicateIps] = useState(false);

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

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Initialize or reset form
  useEffect(() => {
    if (offer) {
      setName(offer.name);
      setAdvertiserId(offer.advertiserId);
      setVisibility(offer.visibility);
      setStatus(offer.status);
      setPreviewUrl(offer.previewUrl || '');
      setDescription(offer.description || '');
      setDomainId(offer.domainId ?? (domains[0]?.id || null));
      setBaseDestinationUrl(offer.baseDestinationUrl);
      setEnforceIpUniqueness(offer.enforceIpUniqueness);
      setBlockDuplicateIps(offer.blockDuplicateIps);
      setPostbackMacroParam(offer.postbackMacroParam || '{clickid}');

      const tg = offer.targetingGroups?.[0];
      if (tg) {
        setTargetingName(tg.name);
        setCondition(tg.condition);
        setDevices(tg.devices.length ? tg.devices : ['All']);
        setCountries(tg.countries.length ? tg.countries : ['United States']);
        setExcludeCountries(tg.excludeCountries);
        setCities(tg.cities || []);
        setExcludeCities(tg.excludeCities);
        setRegions(tg.regions || []);
        setExcludeRegions(tg.excludeRegions);
      }

      const po = offer.payouts?.[0];
      if (po) {
        setPaymentModel(po.paymentModel);
        setCurrency(po.currency);
        setRevenue(Number(po.revenue || 0));
        setPayout(Number(po.payout || 0));
      }

      // Fetch dual-list affiliates for existing offer
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
      setBaseDestinationUrl('https://example-advertiser.com/landing?click_id={clickid}');
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

      // Load all publishers into allAffiliates for new offer
      loadAllPublishersForNew();
    }
    setFieldErrors({});
    setActiveTab('general');
  }, [offer, networks, domains, isOpen]);

  const loadAffiliates = async (offerId: number) => {
    try {
      const dualList = await fetchOfferAffiliates(offerId);
      setAllAffiliates(dualList.allAffiliates);
      setEnabledAffiliates(dualList.enabledAffiliates);
    } catch (err) {
      console.error('Failed to load offer affiliates', err);
    }
  };

  const loadAllPublishersForNew = async () => {
    try {
      const pubs = await fetchPublishers();
      setAllAffiliates(pubs.filter((p) => p.status === 'ACTIVE').map((p) => ({ id: p.id, name: p.name, email: p.email })));
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

  const handleInsertMacro = (macro: string) => {
    setBaseDestinationUrl((prev) => (prev.includes(macro) ? prev : `${prev}&sub_aff=${macro}`));
    setCopiedToken(`Inserted ${macro}`);
    setTimeout(() => setCopiedToken(null), 2000);
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

  // Instant Dual-List Assignment Actions (+) and (-)
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

      const payload = {
        name,
        advertiserId,
        domainId,
        visibility,
        status,
        previewUrl: previewUrl || undefined,
        description: description || undefined,
        baseDestinationUrl,
        enforceIpUniqueness,
        blockDuplicateIps,
        globalPostbackUrl,
        postbackMacroParam,
        targetingGroups: [
          {
            name: targetingName,
            condition,
            devices,
            countries,
            excludeCountries,
            cities,
            excludeCities,
            regions,
            excludeRegions,
          },
        ],
        payouts: [
          {
            paymentModel,
            currency,
            revenue: Number(revenue),
            payout: Number(payout),
          },
        ],
      };

      if (offer?.id) {
        await updateOffer(offer.id, payload);
        onSuccess('Offer updated successfully!');
      } else {
        await createOffer(payload);
        onSuccess('Offer created successfully!');
      }

      if (!andContinue) {
        onClose();
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
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl rounded-xl bg-surface border border-border-subtle shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-elevated/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-fg">
                {offer ? `Edit Offer: ${offer.name}` : 'New Offer Builder'}
              </h2>
              <p className="text-xs text-fg-muted">
                Configure campaign routing, targeting, affiliate access, and revenue payouts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-elevated transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 Tabs Navigation Bar (Max Wave 5-Tab Architecture [03:45]) */}
        <div className="px-6 border-b border-border-subtle flex items-center gap-1 overflow-x-auto text-xs bg-surface">
          {[
            { id: 'general', label: 'General' },
            { id: 'tracking', label: 'Tracking & Controls' },
            { id: 'targeting', label: 'Targeting' },
            { id: 'affiliates', label: 'Affiliates' },
            { id: 'postbacks', label: 'Postbacks' },
            { id: 'revenue', label: 'Revenue & Payouts' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-3 px-4 border-b-2 font-semibold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-fg-muted hover:text-fg'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-fg">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block font-semibold text-fg-muted mb-1">
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
                  } text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary`}
                />
                {fieldErrors.name && (
                  <p className="text-[11px] text-danger mt-1">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-fg-muted mb-1">
                  Advertiser (Network) <span className="text-danger">*</span>
                </label>
                <select
                  value={advertiserId}
                  onChange={(e) => {
                    setAdvertiserId(Number(e.target.value));
                    if (fieldErrors.advertiserId)
                      setFieldErrors({ ...fieldErrors, advertiserId: '' });
                  }}
                  className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                >
                  <option value={0}>Select Advertiser...</option>
                  {networks.map((net) => (
                    <option key={net.id} value={net.id}>
                      {net.name} {net.contactDetails ? `(${net.contactDetails})` : ''}
                    </option>
                  ))}
                </select>
                {fieldErrors.advertiserId && (
                  <p className="text-[11px] text-danger mt-1">
                    {fieldErrors.advertiserId}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-fg-muted mb-1">
                    Visibility <span className="text-danger">*</span>
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as OfferVisibility)}
                    className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
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
                  <label className="block font-semibold text-fg-muted mb-1">
                    Status <span className="text-danger">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OfferStatus)}
                    className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-fg-muted mb-1">Preview URL</label>
                <input
                  type="url"
                  placeholder="https://landingpage-preview.com"
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                  className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-fg-muted mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Campaign restrictions, conversion conditions, and instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* TAB 2: TRACKING & CONTROLS */}
          {activeTab === 'tracking' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Form */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block font-semibold text-fg-muted mb-1">
                    Tracking Domain
                  </label>
                  <select
                    value={domainId ?? ''}
                    onChange={(e) => setDomainId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  >
                    {domains.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-fg-muted">
                      Base Destination URL <span className="text-danger">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopy(baseDestinationUrl, 'Base URL copied')}
                      className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="https://advertiser.com/offer?click_id={clickid}"
                    value={baseDestinationUrl}
                    onChange={(e) => {
                      setBaseDestinationUrl(e.target.value);
                      if (fieldErrors.baseDestinationUrl)
                        setFieldErrors({ ...fieldErrors, baseDestinationUrl: '' });
                    }}
                    className={`w-full bg-surface-elevated border ${
                      fieldErrors.baseDestinationUrl ? 'border-danger' : 'border-border-subtle'
                    } text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary font-mono text-[11px]`}
                  />
                  {fieldErrors.baseDestinationUrl && (
                    <p className="text-[11px] text-danger mt-1">
                      {fieldErrors.baseDestinationUrl}
                    </p>
                  )}
                </div>

                <div className="pt-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="ip-uniq"
                      checked={enforceIpUniqueness}
                      onChange={(e) => setEnforceIpUniqueness(e.target.checked)}
                      className="rounded border-border-subtle text-primary focus:ring-primary"
                    />
                    <label htmlFor="ip-uniq" className="font-semibold text-fg cursor-pointer">
                      Enforce IP uniqueness
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="blk-dup-ip"
                      checked={blockDuplicateIps}
                      onChange={(e) => setBlockDuplicateIps(e.target.checked)}
                      className="rounded border-border-subtle text-primary focus:ring-primary"
                    />
                    <label htmlFor="blk-dup-ip" className="font-semibold text-fg cursor-pointer">
                      Block duplicate IPs
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Col: Macro Reference Pills [04:39] */}
              <div className="panel-card p-4 bg-surface-elevated/40 space-y-3">
                <div className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  <span>Base Destination URL Macros</span>
                </div>
                <p className="text-[11px] text-fg-muted">
                  Click any macro pill to append it to the Base destination URL:
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { token: '{clickid}', desc: 'Unique Click ID (Required)' },
                    { token: '{aff_id}', desc: 'Affiliate ID' },
                    { token: '{offer_id}', desc: 'Offer Campaign ID' },
                    { token: '{sub_id}', desc: 'Sub Parameter 1' },
                    { token: '{country}', desc: 'Country Code (ISO 2)' },
                    { token: '{device_ua}', desc: 'Device User Agent' },
                  ].map((m) => (
                    <button
                      key={m.token}
                      type="button"
                      onClick={() => handleInsertMacro(m.token)}
                      title={m.desc}
                      className="px-2.5 py-1 rounded bg-info/10 hover:bg-info/20 text-info border border-info/30 text-[11px] font-mono transition"
                    >
                      {m.token}
                    </button>
                  ))}
                </div>
                {copiedToken && (
                  <p className="text-[11px] text-emerald-500 font-semibold">{copiedToken}</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TARGETING */}
          {activeTab === 'targeting' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block font-semibold text-fg-muted mb-1">Targeting Group Name</label>
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
                            ? 'bg-info border-info text-white'
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
                  {['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany'].map(
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
          )}

          {/* TAB 4: AFFILIATES (DUAL-LIST ASSIGNMENT [05:24]-[06:20]) */}
          {activeTab === 'affiliates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-fg">Dual-List Affiliate Assignment</h3>
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
                <div className="panel-card p-4 border border-border-subtle bg-surface-elevated/30 flex flex-col h-80">
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
                <div className="panel-card p-4 border border-border-subtle bg-surface-elevated/30 flex flex-col h-80">
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

          {/* TAB 5: POSTBACKS */}
          {activeTab === 'postbacks' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-fg-muted">
                      Global S2S Postback URL
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopy(globalPostbackUrl, 'Postback URL copied')}
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

                <div className="space-y-3 pt-2">
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

              {/* Right Col: Macro Reference Table */}
              <div className="panel-card p-4 bg-surface-elevated/40 space-y-3">
                <div className="font-bold text-xs text-primary">Integration Parameters</div>
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border-subtle text-fg-muted text-left">
                      <th className="pb-1">Parameter</th>
                      <th className="pb-1">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle text-fg">
                    <tr>
                      <td className="py-1 font-mono text-primary font-semibold">clickid</td>
                      <td className="py-1">Unique click identifier (Mandatory)</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-mono text-primary font-semibold">sum</td>
                      <td className="py-1">Conversion revenue amount</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-mono text-primary font-semibold">goal</td>
                      <td className="py-1">Conversion goal tag</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-mono text-primary font-semibold">status</td>
                      <td className="py-1">1: Approved, 2: Pending, 3: Declined</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: REVENUE & PAYOUTS [07:02]-[07:21] */}
          {activeTab === 'revenue' && (
            <div className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-fg-muted mb-1">
                    Payment Model
                  </label>
                  <select
                    value={paymentModel}
                    onChange={(e) => setPaymentModel(e.target.value as PaymentModel)}
                    className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  >
                    <option value="CPA">CPA (Fixed)</option>
                    <option value="CPC">CPC</option>
                    <option value="CPM">CPM</option>
                    <option value="REVSHARE">RevShare</option>
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
                    <option value="AED">AED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-fg-muted mb-1">
                    Revenue (Earned from Advertiser) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={revenue}
                    onChange={(e) => setRevenue(Number(e.target.value))}
                    className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary font-mono"
                  />
                  <p className="text-[11px] text-fg-muted mt-1">
                    Total amount you receive from the network per conversion
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-fg-muted mb-1">
                    Payout (Paid to Publisher) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={payout}
                    onChange={(e) => setPayout(Number(e.target.value))}
                    className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary font-mono"
                  />
                  <p className="text-[11px] text-fg-muted mt-1">
                    Amount visible and paid to the publisher in their dashboard
                  </p>
                </div>
              </div>

              {/* Live Profit Spread Badge [07:18] */}
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
          )}
        </div>

        {/* Action Bar */}
        <div className="px-6 py-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-elevated/40">
          <div>
            {offer?.id && (
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-sm transition"
              >
                Duplicate offer
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-elevated text-xs font-medium text-fg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10 text-xs font-semibold transition"
            >
              Save & continue
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
