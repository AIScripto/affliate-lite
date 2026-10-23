import React, { useState } from 'react';
import { 
  Link2, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  Copy, 
  Search, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Layers,
  HelpCircle,
  Table as TableIcon
} from 'lucide-react';
import { BrandParam, CustomParamDefinition } from '../../types';

interface AffiliateUrlParamsConfigProps {
  brands: BrandParam[];
  onOpenBrandModal: (brand?: BrandParam) => void;
  onDeleteBrand: (id: string) => void;
}

type TabType = 'brands' | 'parameters' | 'sandbox' | 'guide';

export const AffiliateUrlParamsConfig: React.FC<AffiliateUrlParamsConfigProps> = ({
  brands,
  onOpenBrandModal,
  onDeleteBrand,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('brands');
  const [searchTerm, setSearchTerm] = useState('');
  const [paramSearchTerm, setParamSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});

  // Parameter Library state (Standard + Custom)
  const [paramLibrary, setParamLibrary] = useState<CustomParamDefinition[]>([
    { id: 'p_master_id', name: 'Your Master Account ID', param_key: 'partner_id', token: '{master_id}', default_value: 'M_AFF_101', category: 'attribution' },
    { id: 'p_click_id', name: 'Unique Tracking Click ID', param_key: 'click_ref', token: '{click_id}', default_value: 'clk_s2s_89f3a1', category: 'attribution' },
    { id: 'p_ref', name: 'Partner / Influencer Code', param_key: 'sub', token: '{ref}', default_value: 'sub_ali_05', category: 'attribution' },
    { id: 'p_sku', name: 'Product Store Code (SKU)', param_key: 'sku', token: '{sku}', default_value: 'nike-air-max-270', category: 'attribution' },
    { id: 'p_sub1', name: 'Placement (e.g. Header, Bio)', param_key: 'sub1', token: '{sub1}', default_value: 'hero_cta', category: 'campaign' },
    { id: 'p_sub2', name: 'Creative (e.g. Video 1, Banner)', param_key: 'sub2', token: '{sub2}', default_value: 'video_v1', category: 'campaign' },
    { id: 'p_sub3', name: 'Ad Group / Target Audience', param_key: 'sub3', token: '{sub3}', default_value: 'ad_group_9', category: 'campaign' },
    { id: 'p_utm_source', name: 'Traffic Source (e.g. YouTube)', param_key: 'utm_source', token: '{utm_source}', default_value: 'youtube', category: 'campaign' },
    { id: 'p_utm_campaign', name: 'Campaign Name', param_key: 'utm_campaign', token: '{utm_campaign}', default_value: 'summer_launch', category: 'campaign' },
    { id: 'p_device', name: 'Visitor Device (Mobile/PC)', param_key: 'dev', token: '{device}', default_value: 'mobile', category: 'device' },
  ]);

  // Form to add a new parameter
  const [showAddParam, setShowAddParam] = useState(false);
  const [newParamName, setNewParamName] = useState('');
  const [newParamKey, setNewParamKey] = useState('');
  const [newParamDefault, setNewParamDefault] = useState('');
  const [newParamCategory, setNewParamCategory] = useState<'attribution' | 'campaign' | 'device' | 'custom'>('custom');

  // Interactive Live URL Test Sandbox
  const [sandboxBrandId, setSandboxBrandId] = useState<string>(brands[0]?.id || '');
  const [sandboxValues, setSandboxValues] = useState<Record<string, string>>({
    '{sku}': 'nike-air-max-270',
    '{ref}': 'sub_ali_05',
    '{sub1}': 'hero_cta',
    '{sub2}': 'video_v1',
    '{sub3}': 'ad_group_9',
    '{utm_source}': 'youtube',
    '{utm_campaign}': 'summer_launch',
    '{device}': 'mobile',
  });
  const [sandboxCopied, setSandboxCopied] = useState(false);

  const selectedBrand = brands.find(b => b.id === sandboxBrandId) || brands[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleSecret = (id: string) => {
    setRevealedSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddGlobalParam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParamName.trim() || !newParamKey.trim()) return;

    const cleanKey = newParamKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const tokenFormatted = `{${cleanKey}}`;
    const newP: CustomParamDefinition = {
      id: `param_${Date.now()}`,
      name: newParamName.trim(),
      param_key: cleanKey,
      token: tokenFormatted,
      default_value: newParamDefault.trim() || 'demo_val',
      category: newParamCategory,
    };

    setParamLibrary(prev => [...prev, newP]);
    setSandboxValues(prev => ({ ...prev, [tokenFormatted]: newParamDefault.trim() || 'demo_val' }));
    setNewParamName('');
    setNewParamKey('');
    setNewParamDefault('');
    setShowAddParam(false);
  };

  const handleDeleteParam = (id: string) => {
    setParamLibrary(prev => prev.filter(p => p.id !== id));
  };

  const filteredBrands = brands.filter(b => 
    b.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.master_aff_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.url_template.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredParams = paramLibrary.filter(p =>
    p.name.toLowerCase().includes(paramSearchTerm.toLowerCase()) ||
    p.param_key.toLowerCase().includes(paramSearchTerm.toLowerCase()) ||
    p.token.toLowerCase().includes(paramSearchTerm.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(paramSearchTerm.toLowerCase()))
  );

  // Compile Sandbox Live URL using both standard tokens and all defined parameters
  const compileSandboxUrl = () => {
    if (!selectedBrand) return '';
    let compiled = selectedBrand.url_template
      .replace(/\{master_id\}/g, encodeURIComponent(selectedBrand.master_aff_id))
      .replace(/\{click_id\}/g, 'clk_s2s_89f3a1');

    // Replace all sandbox parameter tokens
    Object.entries(sandboxValues).forEach(([token, val]) => {
      const regex = new RegExp(token.replace(/[{}]/g, '\\$&'), 'g');
      compiled = compiled.replace(regex, encodeURIComponent(val));
    });

    // If template doesn't have utm parameters directly, append if available
    try {
      const url = new URL(compiled);
      if (sandboxValues['{utm_source}'] && !compiled.includes('utm_source=')) {
        url.searchParams.set('utm_source', sandboxValues['{utm_source}']);
      }
      if (sandboxValues['{utm_campaign}'] && !compiled.includes('utm_campaign=')) {
        url.searchParams.set('utm_campaign', sandboxValues['{utm_campaign}']);
      }
      return url.toString();
    } catch {
      return compiled;
    }
  };

  const compiledSandboxUrl = compileSandboxUrl();

  // Extract all tokens present in selected brand template
  const tokensInTemplate: string[] = selectedBrand?.url_template.match(/\{([a-zA-Z0-9_]+)\}/g) || [];

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Link2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Link Parameters &amp; Brand Templates
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Easily manage your brand website links, add tracking codes, and test links before using them.
          </p>
        </div>

        <button
          onClick={() => onOpenBrandModal()}
          className="btn-3d-indigo flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Brand Template</span>
        </button>
      </div>

      {/* Navigation Tabs (Tabbed format for clean layout) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('brands')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'brands'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Brand Link Templates ({brands.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('parameters')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'parameters'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Link Parameters Table ({paramLibrary.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sandbox')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'sandbox'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Test Link (Simulator)</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'guide'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>How It Works (Easy Guide)</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: BRAND URL TEMPLATES */}
      {/* ============================================================== */}
      {activeTab === 'brands' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Registered Brands &amp; Stores ({filteredBrands.length})
            </span>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search brand name or link..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
          </div>

          {/* Brand Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBrands.map((brand) => (
              <div 
                key={brand.id}
                className="panel-3d rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between hover:border-indigo-400 dark:hover:border-slate-700 transition-all shadow-sm"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shadow-sm">
                        {brand.brand_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">{brand.brand_name}</h3>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {brand.master_aff_id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenBrandModal(brand)}
                        className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Brand Link"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteBrand(brand.id)}
                        className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Brand"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Keys table */}
                  <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800/80 text-[11px] font-mono mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tracking Key:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{brand.click_id_param_key}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Partner Key:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{brand.sub_ref_param_key}</span>
                    </div>
                  </div>

                  {/* Outbound URL Template */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                      <span>Brand Website Link:</span>
                      <button
                        onClick={() => handleCopy(brand.url_template, `tmpl-${brand.id}`)}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        {copiedKey === `tmpl-${brand.id}` ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 break-all leading-tight shadow-inner">
                      {brand.url_template}
                    </div>
                  </div>
                </div>

                {/* Secret Token */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-mono text-slate-500">
                    <span className="text-[10px]">Secret Token:</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {revealedSecrets[brand.id] ? brand.postback_secret : '••••••••••••'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleSecret(brand.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title={revealedSecrets[brand.id] ? 'Hide Secret' : 'Show Secret'}
                  >
                    {revealedSecrets[brand.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: LINK PARAMETERS TABLE (NO CLUTTERED PILLS!) */}
      {/* ============================================================== */}
      {activeTab === 'parameters' && (
        <div className="panel-3d rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4">
          {/* Header & Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-indigo-500" />
                <span>Link Parameters Table ({paramLibrary.length} Defined)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every parameter available to attach to your tracking links. Always neatly organized in a table.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={paramSearchTerm}
                  onChange={(e) => setParamSearchTerm(e.target.value)}
                  placeholder="Filter parameters..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={() => setShowAddParam(!showAddParam)}
                className="btn-3d-indigo flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add New Parameter</span>
              </button>
            </div>
          </div>

          {/* Add Parameter Drawer Form */}
          {showAddParam && (
            <form onSubmit={handleAddGlobalParam} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-indigo-500/30 shadow-md space-y-3 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                Define a New Parameter (Custom Link Tag)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Parameter Name (What is this?)
                  </label>
                  <input
                    type="text"
                    required
                    value={newParamName}
                    onChange={(e) => {
                      setNewParamName(e.target.value);
                      if (!newParamKey) {
                        setNewParamKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                      }
                    }}
                    placeholder="e.g. Ad Creative ID"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Query Key on Brand URL
                  </label>
                  <input
                    type="text"
                    required
                    value={newParamKey}
                    onChange={(e) => setNewParamKey(e.target.value)}
                    placeholder="e.g. creative_id"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newParamCategory}
                    onChange={(e) => setNewParamCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="custom">Custom Tag</option>
                    <option value="campaign">Marketing / Campaign</option>
                    <option value="attribution">Tracking Token</option>
                    <option value="device">Device / Location</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Example Test Value
                  </label>
                  <input
                    type="text"
                    value={newParamDefault}
                    onChange={(e) => setNewParamDefault(e.target.value)}
                    placeholder="e.g. banner_top"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddParam(false)}
                  className="px-3 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-indigo px-4 py-1 rounded-lg text-xs font-bold text-white shadow-sm"
                >
                  Save Parameter
                </button>
              </div>
            </form>
          )}

          {/* TABLE OF PARAMETERS (Structured & Clear) */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3.5">Parameter Name</th>
                  <th className="py-3 px-3">Placeholder Token</th>
                  <th className="py-3 px-3">Brand URL Key</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Example Value</th>
                  <th className="py-3 px-3">URL Query String</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-xs">
                {filteredParams.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                      No parameters found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredParams.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      {/* Name */}
                      <td className="py-3 px-3.5 font-sans font-semibold text-slate-900 dark:text-white">
                        {item.name}
                      </td>

                      {/* Token */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleCopy(item.token, `token-${item.id}`)}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 font-bold hover:bg-indigo-100"
                          title="Click to copy token"
                        >
                          <span>{item.token}</span>
                          {copiedKey === `token-${item.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        </button>
                      </td>

                      {/* Brand Key */}
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        <code>{item.param_key}</code>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          item.category === 'attribution'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : item.category === 'campaign'
                            ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
                            : item.category === 'device'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {item.category || 'custom'}
                        </span>
                      </td>

                      {/* Example Value */}
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                        {item.default_value || '—'}
                      </td>

                      {/* Full URL snippet */}
                      <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                        &amp;{item.param_key}={item.token}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-sans">
                          <button
                            onClick={() => handleCopy(`&${item.param_key}=${item.token}`, `full-${item.id}`)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-colors"
                            title="Copy full query parameter string"
                          >
                            {copiedKey === `full-${item.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-400" />
                                <span>Copy &amp; Key</span>
                              </>
                            )}
                          </button>

                          {item.id.startsWith('param_') && (
                            <button
                              onClick={() => handleDeleteParam(item.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                              title="Delete custom parameter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: TEST LINK SANDBOX */}
      {/* ============================================================== */}
      {activeTab === 'sandbox' && (
        <div className="panel-3d rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Test Link Simulator (Sandbox)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pick a brand and test how all parameters get replaced into the final store link.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Select Brand:</span>
              <select
                value={sandboxBrandId}
                onChange={(e) => setSandboxBrandId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 shadow-sm"
              >
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.brand_name} ({b.master_aff_id})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Test Inputs */}
          <div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Step 1: Enter Test Values
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {tokensInTemplate.map((tok) => (
                <div key={tok}>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 font-mono">
                    {tok}
                  </label>
                  <input
                    type="text"
                    value={sandboxValues[tok] || ''}
                    onChange={(e) => setSandboxValues({ ...sandboxValues, [tok]: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Result Box */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Step 2: Final Outbound Link (What the Brand Receives):
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(compiledSandboxUrl);
                  setSandboxCopied(true);
                  setTimeout(() => setSandboxCopied(false), 2000);
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
              >
                {sandboxCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{sandboxCopied ? 'Copied Link!' : 'Copy Final Link'}</span>
              </button>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 break-all leading-relaxed shadow-inner select-all">
              {compiledSandboxUrl}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: HOW TRACKING WORKS (EASY GUIDE FOR NON-NATIVE SPEAKERS) */}
      {/* ============================================================== */}
      {activeTab === 'guide' && (
        <div className="panel-3d rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                How Tracking Links Work (2 Easy Steps)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simple explanation for anyone new to affiliate tracking.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  1
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Visitor Clicks Your Link
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                When a shopper clicks your public short link, they visit:
              </p>
              <div className="p-3 rounded-xl bg-white dark:bg-black/60 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200">
                yourdomain.com/go/shoe?ref=partner&amp;src=youtube
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>We log where they came from (YouTube, TikTok, etc.).</li>
                <li>We create a unique <strong>Tracking ID</strong> (Click ID).</li>
                <li>We protect privacy (we do not store personal details).</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  2
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Visitor Goes to the Brand Store
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                In less than 50 milliseconds (faster than an eye blink), we send the shopper to the store:
              </p>
              <div className="p-3 rounded-xl bg-white dark:bg-black/60 border border-slate-200 dark:border-slate-800 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                brand.com/shoe?partner_id=M101&amp;click_ref=clk_992
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>The brand remembers your Tracking ID.</li>
                <li>When the visitor buys, the brand notifies us (Webhook).</li>
                <li>You receive your commission automatically!</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
