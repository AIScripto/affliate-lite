import { useState } from 'react';
import {
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  Globe,
  Sliders,
  HelpCircle,
  X,
} from 'lucide-react';
import { OfferTargetingUrl } from '../../../types';

export interface TargetingGroupState {
  id: string;
  name: string;
  condition: 'AND' | 'OR';
  isEnabled: boolean;
  isExpanded: boolean;
  affiliates: string; // 'ALL' or comma-separated publisher IDs
  preset: string;
  countries: string[];
  excludeCountries: boolean;
  cities: string[];
  excludeCities: boolean;
  regions: string[];
  excludeRegions: boolean;
  urls: OfferTargetingUrl[];
  showAdvanced: boolean;
  devices: string[];
  operatingSystems: string[];
  browsers: string[];
  connectionTypes: string[];
  carriers: string[];
  ips: string;
  languages: string[];
}

interface TargetingGroupCardProps {
  group: TargetingGroupState;
  index: number;
  totalGroups: number;
  allPublishers: Array<{ id: number; name: string; email: string }>;
  onUpdate: (updated: TargetingGroupState) => void;
  onDuplicate: (group: TargetingGroupState) => void;
  onDelete: (id: string) => void;
  onOpenUrlsGuide: () => void;
}

const COMMON_COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'Italy',
  'Spain',
  'Netherlands',
  'Brazil',
  'India',
];

const PRESETS = [
  { label: 'Select preset', value: '' },
  { label: 'Tier 1 Countries (US, UK, CA, AU, DE, FR)', value: 'tier_1' },
  { label: 'North America (US, CA)', value: 'na' },
  { label: 'Europe Tier 1 (UK, DE, FR, IT, ES, NL)', value: 'eu_tier1' },
  { label: 'Latin America (BR, MX, AR, CO, CL)', value: 'latam' },
  { label: 'Asia-Pacific (JP, KR, SG, AU, IN)', value: 'apac' },
  { label: 'Mobile Traffic Only (iOS, Android, Tablet)', value: 'mobile_only' },
  { label: 'Desktop Workstations Only (PC, macOS, Linux)', value: 'desktop_only' },
  { label: 'Clean High-Speed Traffic (Wi-Fi / Broadband)', value: 'clean_wifi' },
];

const DEVICE_OPTIONS = ['All', 'PC', 'Android', 'iOS', 'Tablet', 'Smart TV', 'macOS', 'Windows', 'Linux'];
const OS_OPTIONS = ['Windows', 'macOS', 'iOS', 'Android', 'Linux', 'ChromeOS'];
const BROWSER_OPTIONS = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'Samsung Internet'];
const CONNECTION_OPTIONS = ['Wi-Fi', 'Cellular (3G/4G/5G)', 'Cable / DSL', 'Corporate'];
const CARRIER_OPTIONS = ['Verizon', 'AT&T', 'T-Mobile', 'Vodafone', 'O2', 'Orange', 'EE', 'Movistar'];
const LANGUAGE_OPTIONS = ['English (en)', 'Spanish (es)', 'French (fr)', 'German (de)', 'Japanese (ja)', 'Chinese (zh)', 'Arabic (ar)', 'Portuguese (pt)'];

export function TargetingGroupCard({
  group,
  index: _index,
  totalGroups,
  allPublishers,
  onUpdate,
  onDuplicate,
  onDelete,
  onOpenUrlsGuide,
}: TargetingGroupCardProps) {
  const [cityInput, setCityInput] = useState('');
  const [regionInput, setRegionInput] = useState('');
  const [newUrlTitle, setNewUrlTitle] = useState('');
  const [newUrlValue, setNewUrlValue] = useState('');
  const [showAddUrlInline, setShowAddUrlInline] = useState(false);

  // Preset Selection Handler
  const handleSelectPreset = (presetVal: string) => {
    let newCountries = [...group.countries];
    let newDevices = [...group.devices];
    let newConnections = [...group.connectionTypes];

    if (presetVal === 'tier_1') {
      newCountries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France'];
    } else if (presetVal === 'na') {
      newCountries = ['United States', 'Canada'];
    } else if (presetVal === 'eu_tier1') {
      newCountries = ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands'];
    } else if (presetVal === 'latam') {
      newCountries = ['Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile'];
    } else if (presetVal === 'apac') {
      newCountries = ['Japan', 'South Korea', 'Singapore', 'Australia', 'India'];
    } else if (presetVal === 'mobile_only') {
      newDevices = ['Android', 'iOS', 'Tablet'];
    } else if (presetVal === 'desktop_only') {
      newDevices = ['PC', 'macOS', 'Windows', 'Linux'];
    } else if (presetVal === 'clean_wifi') {
      newConnections = ['Wi-Fi', 'Cable / DSL'];
    }

    onUpdate({
      ...group,
      preset: presetVal,
      countries: newCountries,
      devices: newDevices,
      connectionTypes: newConnections,
    });
  };

  // Add City Tag
  const handleAddCity = () => {
    const trimmed = cityInput.trim();
    if (trimmed && !group.cities.includes(trimmed)) {
      onUpdate({ ...group, cities: [...group.cities, trimmed] });
      setCityInput('');
    }
  };

  // Add Region Tag
  const handleAddRegion = () => {
    const trimmed = regionInput.trim();
    if (trimmed && !group.regions.includes(trimmed)) {
      onUpdate({ ...group, regions: [...group.regions, trimmed] });
      setRegionInput('');
    }
  };

  // Toggle Item in Array
  const toggleArrayItem = (list: string[], item: string): string[] => {
    if (item === 'All') return ['All'];
    const withoutAll = list.filter((i) => i !== 'All');
    if (withoutAll.includes(item)) {
      const filtered = withoutAll.filter((i) => i !== item);
      return filtered.length === 0 ? ['All'] : filtered;
    }
    return [...withoutAll, item];
  };

  // Add Targeting Group URL
  const handleAddUrl = () => {
    if (!newUrlValue.trim()) return;
    const item: OfferTargetingUrl = {
      id: `tg_url_${Date.now()}`,
      title: newUrlTitle.trim() || `Landing Variant #${group.urls.length + 1}`,
      url: newUrlValue.trim(),
      weight: 100,
      isEnabled: true,
    };
    onUpdate({ ...group, urls: [...group.urls, item] });
    setNewUrlTitle('');
    setNewUrlValue('');
    setShowAddUrlInline(false);
  };

  const handleRemoveUrl = (urlId: string) => {
    onUpdate({ ...group, urls: group.urls.filter((u) => u.id !== urlId) });
  };

  return (
    <div className="panel-card border border-border-subtle bg-surface shadow-sm rounded-xl overflow-hidden transition hover:border-primary/40">
      {/* Top Header Row of the Group Card */}
      <div className="p-4 bg-surface-elevated/40 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          {/* Group Name input */}
          <div className="flex-1 max-w-xs">
            <input
              type="text"
              value={group.name}
              onChange={(e) => onUpdate({ ...group, name: e.target.value })}
              placeholder="Targeting group #1"
              className="w-full bg-surface border border-border-subtle text-black dark:text-white font-bold rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          {/* Condition: AND / OR Segmented Toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-black dark:text-white">Condition:</span>
            <div className="inline-flex rounded-lg border border-border-subtle p-0.5 bg-surface-elevated">
              <button
                type="button"
                onClick={() => onUpdate({ ...group, condition: 'AND' })}
                className={`px-3 py-1 rounded text-xs font-bold transition ${
                  group.condition === 'AND'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                AND
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ ...group, condition: 'OR' })}
                className={`px-3 py-1 rounded text-xs font-bold transition ${
                  group.condition === 'OR'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                OR
              </button>
            </div>
          </div>
        </div>

        {/* Group Actions: On/Off Switch, Duplicate, Delete, Collapse */}
        <div className="flex items-center gap-2">
          {/* Switch On/Off */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="text-xs font-bold text-black dark:text-white">
              {group.isEnabled ? 'On' : 'Off'}
            </span>
            <input
              type="checkbox"
              checked={group.isEnabled}
              onChange={(e) => onUpdate({ ...group, isEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Duplicate Button */}
          <button
            type="button"
            onClick={() => onDuplicate(group)}
            className="p-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-elevated text-fg-muted hover:text-primary transition"
            title="Duplicate Targeting Group"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(group.id)}
            disabled={totalGroups <= 1}
            className={`p-1.5 rounded-lg border border-border-subtle transition ${
              totalGroups <= 1
                ? 'opacity-40 cursor-not-allowed bg-surface text-fg-muted'
                : 'bg-surface hover:bg-danger/10 text-fg-muted hover:text-danger'
            }`}
            title={totalGroups <= 1 ? 'At least one targeting group is required' : 'Delete Targeting Group'}
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => onUpdate({ ...group, isExpanded: !group.isExpanded })}
            className="p-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-elevated text-fg-muted hover:text-fg transition ml-1"
            title="Collapse / Expand Group"
          >
            {group.isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Group Body (Shown when isExpanded) */}
      {group.isExpanded && (
        <div className="p-6 space-y-5 text-xs">
          {/* Affiliates Selector */}
          <div>
            <label className="block font-bold text-black dark:text-white mb-1.5">
              Affiliates
            </label>
            <select
              value={group.affiliates}
              onChange={(e) => onUpdate({ ...group, affiliates: e.target.value })}
              className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Affiliates (Apply rule to all publishers)</option>
              {allPublishers.map((pub) => (
                <option key={pub.id} value={String(pub.id)}>
                  Publisher #{pub.id} - {pub.name} ({pub.email})
                </option>
              ))}
            </select>
          </div>

          {/* Row 2: Presets & Countries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Presets */}
            <div>
              <label className="block font-bold text-black dark:text-white mb-1.5">
                Presets
              </label>
              <select
                value={group.preset}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
              >
                {PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-fg-muted mt-1">
                Select a preset to auto-populate recommended country and device profiles.
              </p>
            </div>

            {/* Countries with Exclude Checkbox */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-black dark:text-white">Countries</label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={group.excludeCountries}
                    onChange={(e) => onUpdate({ ...group, excludeCountries: e.target.checked })}
                    className="rounded border-border-subtle text-danger"
                  />
                  <span className={group.excludeCountries ? 'text-danger font-bold' : 'text-fg-muted'}>
                    Exclude
                  </span>
                </label>
              </div>

              {/* Country Selection Chips */}
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-lg border border-border-subtle bg-surface-elevated/30">
                {COMMON_COUNTRIES.map((country) => {
                  const isSelected = group.countries.includes(country);
                  return (
                    <button
                      key={country}
                      type="button"
                      onClick={() => {
                        const updated = isSelected
                          ? group.countries.filter((c) => c !== country)
                          : [...group.countries, country];
                        onUpdate({ ...group, countries: updated });
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                        isSelected
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-surface border border-border-subtle text-fg-muted hover:text-fg'
                      }`}
                    >
                      {country} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 3: Cities & Regions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cities */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-black dark:text-white">Cities</label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={group.excludeCities}
                    onChange={(e) => onUpdate({ ...group, excludeCities: e.target.checked })}
                    className="rounded border-border-subtle text-danger"
                  />
                  <span className={group.excludeCities ? 'text-danger font-bold' : 'text-fg-muted'}>
                    Exclude
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCity();
                      }
                    }}
                    placeholder="Type city (e.g. New York, London) and press Enter"
                    className="flex-1 bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddCity}
                    className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border-subtle hover:bg-surface font-semibold text-xs transition"
                  >
                    Add
                  </button>
                </div>

                {/* Cities Chips */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg border border-border-subtle bg-surface-elevated/20">
                  {group.cities.map((city) => (
                    <span
                      key={city}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px] font-medium"
                    >
                      <span>{city}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdate({ ...group, cities: group.cities.filter((c) => c !== city) })
                        }
                        className="hover:text-danger"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {group.cities.length === 0 && (
                    <span className="text-[11px] text-fg-muted italic">All cities included</span>
                  )}
                </div>
              </div>
            </div>

            {/* Regions */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-black dark:text-white">Regions / States</label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={group.excludeRegions}
                    onChange={(e) => onUpdate({ ...group, excludeRegions: e.target.checked })}
                    className="rounded border-border-subtle text-danger"
                  />
                  <span className={group.excludeRegions ? 'text-danger font-bold' : 'text-fg-muted'}>
                    Exclude
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={regionInput}
                    onChange={(e) => setRegionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRegion();
                      }
                    }}
                    placeholder="Type state/region (e.g. California, Ontario) and press Enter"
                    className="flex-1 bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddRegion}
                    className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border-subtle hover:bg-surface font-semibold text-xs transition"
                  >
                    Add
                  </button>
                </div>

                {/* Regions Chips */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg border border-border-subtle bg-surface-elevated/20">
                  {group.regions.map((reg) => (
                    <span
                      key={reg}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[11px] font-medium"
                    >
                      <span>{reg}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdate({ ...group, regions: group.regions.filter((r) => r !== reg) })
                        }
                        className="hover:text-danger"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {group.regions.length === 0 && (
                    <span className="text-[11px] text-fg-muted italic">All regions included</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Targeting Group URLs */}
          <div className="p-4 rounded-xl border border-border-subtle bg-surface-elevated/30 space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-black dark:text-white text-xs">Targeting group URLs</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated font-semibold text-fg-muted">
                  {group.urls.length} URLs configured
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenUrlsGuide}
                  className="text-primary hover:underline flex items-center gap-1 text-[11px] font-semibold"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>How to use it?</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUrlInline(!showAddUrlInline)}
                  className="px-2.5 py-1 rounded-md bg-primary hover:bg-primary-hover text-white font-semibold text-[11px] transition shadow-sm flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add URL</span>
                </button>
              </div>
            </div>

            {/* Inline Add URL Form */}
            {showAddUrlInline && (
              <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="URL Title (e.g. UK Landing Page)"
                    value={newUrlTitle}
                    onChange={(e) => setNewUrlTitle(e.target.value)}
                    className="bg-surface border border-border-subtle text-fg rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="https://example.com/geo?clickid={clickid}"
                    value={newUrlValue}
                    onChange={(e) => setNewUrlValue(e.target.value)}
                    className="sm:col-span-2 bg-surface border border-border-subtle text-fg font-mono rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddUrlInline(false)}
                    className="px-3 py-1 rounded text-fg-muted hover:text-fg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    className="px-3 py-1 rounded bg-primary text-white font-semibold text-xs"
                  >
                    Save URL
                  </button>
                </div>
              </div>
            )}

            {/* URLs Scannable Table */}
            {group.urls.length > 0 ? (
              <div className="rounded-lg border border-border-subtle overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-surface-elevated border-b border-border-subtle">
                    <tr className="text-[11px] font-bold text-black dark:text-white uppercase">
                      <th className="py-2 px-3">Title</th>
                      <th className="py-2 px-3">Destination URL</th>
                      <th className="py-2 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle bg-surface">
                    {group.urls.map((u) => (
                      <tr key={u.id} className="hover:bg-surface-elevated/40">
                        <td className="py-2 px-3 font-bold text-black dark:text-white">
                          {u.title}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-fg-muted truncate max-w-xs">
                          {u.url}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveUrl(u.id!)}
                            className="p-1 rounded text-fg-muted hover:text-danger transition"
                            title="Remove URL"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-3 text-center text-[11px] text-fg-muted italic">
                No group-specific URLs configured. Matching traffic will route to the Offer's Base
                Destination URL.
              </div>
            )}
          </div>

          {/* Section 5: Advanced Settings (Collapsible) */}
          <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-elevated/20">
            <button
              type="button"
              onClick={() => onUpdate({ ...group, showAdvanced: !group.showAdvanced })}
              className="w-full p-3.5 bg-surface-elevated/60 flex items-center justify-between text-left hover:bg-surface-elevated transition select-none"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <span className="font-bold text-black dark:text-white text-xs">
                  {group.showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}
                </span>
                <span className="text-[10px] text-fg-muted">
                  (Devices, Operating Systems, Browsers, Carriers, IP Whitelist)
                </span>
              </div>
              {group.showAdvanced ? <ChevronUp className="w-4 h-4 text-fg-muted" /> : <ChevronDown className="w-4 h-4 text-fg-muted" />}
            </button>

            {group.showAdvanced && (
              <div className="p-5 space-y-4 border-t border-border-subtle bg-surface">
                {/* Devices */}
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1.5">
                    Devices
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DEVICE_OPTIONS.map((dev) => {
                      const isSelected = group.devices.includes(dev);
                      return (
                        <button
                          key={dev}
                          type="button"
                          onClick={() =>
                            onUpdate({ ...group, devices: toggleArrayItem(group.devices, dev) })
                          }
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                            isSelected
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-surface-elevated border border-border-subtle text-fg-muted hover:text-fg'
                          }`}
                        >
                          {dev} {isSelected && dev !== 'All' && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Operating Systems */}
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1.5">
                    Operating Systems
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {OS_OPTIONS.map((os) => {
                      const isSelected = group.operatingSystems.includes(os);
                      return (
                        <button
                          key={os}
                          type="button"
                          onClick={() => {
                            const updated = isSelected
                              ? group.operatingSystems.filter((o) => o !== os)
                              : [...group.operatingSystems, os];
                            onUpdate({ ...group, operatingSystems: updated });
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                            isSelected
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-surface-elevated border border-border-subtle text-fg-muted hover:text-fg'
                          }`}
                        >
                          {os} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Browsers & Connection Types */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Browsers */}
                  <div>
                    <label className="block font-bold text-black dark:text-white mb-1.5">
                      Browsers
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {BROWSER_OPTIONS.map((browser) => {
                        const isSelected = group.browsers.includes(browser);
                        return (
                          <button
                            key={browser}
                            type="button"
                            onClick={() => {
                              const updated = isSelected
                                ? group.browsers.filter((b) => b !== browser)
                                : [...group.browsers, browser];
                              onUpdate({ ...group, browsers: updated });
                            }}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                              isSelected
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-surface-elevated border border-border-subtle text-fg-muted hover:text-fg'
                            }`}
                          >
                            {browser}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Connection Types */}
                  <div>
                    <label className="block font-bold text-black dark:text-white mb-1.5">
                      Connection Types
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CONNECTION_OPTIONS.map((conn) => {
                        const isSelected = group.connectionTypes.includes(conn);
                        return (
                          <button
                            key={conn}
                            type="button"
                            onClick={() => {
                              const updated = isSelected
                                ? group.connectionTypes.filter((c) => c !== conn)
                                : [...group.connectionTypes, conn];
                              onUpdate({ ...group, connectionTypes: updated });
                            }}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                              isSelected
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : 'bg-surface-elevated border border-border-subtle text-fg-muted hover:text-fg'
                            }`}
                          >
                            {conn}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Mobile Carriers */}
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1.5">
                    Mobile Carriers & ISPs
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CARRIER_OPTIONS.map((carrier) => {
                      const isSelected = group.carriers.includes(carrier);
                      return (
                        <button
                          key={carrier}
                          type="button"
                          onClick={() => {
                            const updated = isSelected
                              ? group.carriers.filter((c) => c !== carrier)
                              : [...group.carriers, carrier];
                            onUpdate({ ...group, carriers: updated });
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                            isSelected
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-surface-elevated border border-border-subtle text-fg-muted hover:text-fg'
                          }`}
                        >
                          {carrier}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1.5">
                    Browser Languages
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {LANGUAGE_OPTIONS.map((lang) => {
                      const isSelected = group.languages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            const updated = isSelected
                              ? group.languages.filter((l) => l !== lang)
                              : [...group.languages, lang];
                            onUpdate({ ...group, languages: updated });
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                            isSelected
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-surface-elevated border border-border-subtle text-fg-muted hover:text-fg'
                          }`}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* IP Range / CIDR Whitelist */}
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1">
                    IP Filtering (CIDR / IP Subnets)
                  </label>
                  <textarea
                    rows={2}
                    value={group.ips}
                    onChange={(e) => onUpdate({ ...group, ips: e.target.value })}
                    placeholder="Enter CIDR subnets or IPs separated by comma or new lines (e.g. 192.168.1.0/24, 10.0.0.0/8)"
                    className="w-full bg-surface-elevated border border-border-subtle text-fg font-mono text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
