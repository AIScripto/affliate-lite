import React, { useState, useEffect } from 'react';
import { 
  X, 
  Globe, 
  Plus, 
  Sparkles, 
  Check, 
  Table as TableIcon
} from 'lucide-react';
import { BrandParam, CustomParamDefinition } from '../../types';

interface BrandParamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<BrandParam>) => Promise<void>;
  brand?: BrandParam | null;
}

const DEFAULT_STANDARD_PARAMS: CustomParamDefinition[] = [
  { id: 'master_id', name: 'Master Account ID', param_key: 'partner_id', token: '{master_id}', default_value: 'M_AFF_101', category: 'attribution' },
  { id: 'click_id', name: 'Unique Tracking Click ID', param_key: 'click_ref', token: '{click_id}', default_value: 'clk_s2s_984', category: 'attribution' },
  { id: 'ref', name: 'Partner / Influencer Code', param_key: 'sub', token: '{ref}', default_value: 'sub_ali_05', category: 'attribution' },
  { id: 'sku', name: 'Product Store Code (SKU)', param_key: 'sku', token: '{sku}', default_value: 'nike-air-max', category: 'attribution' },
  { id: 'sub1', name: 'Placement (Header, Bio, etc.)', param_key: 'sub1', token: '{sub1}', default_value: 'hero_banner', category: 'campaign' },
  { id: 'sub2', name: 'Creative (Video, Banner, etc.)', param_key: 'sub2', token: '{sub2}', default_value: 'video_ad_1', category: 'campaign' },
  { id: 'sub3', name: 'Target Audience / Group', param_key: 'sub3', token: '{sub3}', default_value: 'running_shoes', category: 'campaign' },
  { id: 'utm_source', name: 'Traffic Source (e.g. YouTube)', param_key: 'utm_source', token: '{utm_source}', default_value: 'youtube', category: 'campaign' },
  { id: 'utm_campaign', name: 'Campaign Name', param_key: 'utm_campaign', token: '{utm_campaign}', default_value: 'summer_drop', category: 'campaign' },
  { id: 'device', name: 'Visitor Device (Mobile/PC)', param_key: 'dev', token: '{device}', default_value: 'mobile', category: 'device' },
];

export const BrandParamModal: React.FC<BrandParamModalProps> = ({
  isOpen,
  onClose,
  onSave,
  brand,
}) => {
  const [brandName, setBrandName] = useState('');
  const [masterAffId, setMasterAffId] = useState('');
  const [urlTemplate, setUrlTemplate] = useState('');
  const [clickIdParamKey, setClickIdParamKey] = useState('click_ref');
  const [subRefParamKey, setSubRefParamKey] = useState('sub');
  const [postbackSecret, setPostbackSecret] = useState('');
  const [customParams, setCustomParams] = useState<CustomParamDefinition[]>(DEFAULT_STANDARD_PARAMS);
  const [loading, setLoading] = useState(false);

  // New Custom Parameter Form
  const [showAddParam, setShowAddParam] = useState(false);
  const [newParamName, setNewParamName] = useState('');
  const [newParamKey, setNewParamKey] = useState('');
  const [newParamToken, setNewParamToken] = useState('');
  const [newParamDefault, setNewParamDefault] = useState('');
  const [newParamCategory, setNewParamCategory] = useState<'attribution' | 'campaign' | 'device' | 'custom'>('custom');

  useEffect(() => {
    if (brand) {
      setBrandName(brand.brand_name);
      setMasterAffId(brand.master_aff_id);
      setUrlTemplate(brand.url_template);
      setClickIdParamKey(brand.click_id_param_key || 'click_ref');
      setSubRefParamKey(brand.sub_ref_param_key || 'sub');
      setPostbackSecret(brand.postback_secret || '');
      if (brand.custom_params && Array.isArray(brand.custom_params) && brand.custom_params.length > 0) {
        setCustomParams(brand.custom_params);
      } else {
        setCustomParams(DEFAULT_STANDARD_PARAMS);
      }
    } else {
      setBrandName('');
      setMasterAffId('');
      setUrlTemplate('https://brand.com/p/{sku}?partner_id={master_id}&click_ref={click_id}&sub={ref}');
      setClickIdParamKey('click_ref');
      setSubRefParamKey('sub');
      setPostbackSecret(`sec_${Math.random().toString(36).substring(2, 10)}`);
      setCustomParams(DEFAULT_STANDARD_PARAMS);
    }
  }, [brand, isOpen]);

  if (!isOpen) return null;

  // Insert token at cursor position or append
  const insertToken = (token: string) => {
    setUrlTemplate(prev => {
      if (prev.includes(token)) return prev;
      return prev + (prev.includes('?') ? '&' : '?') + token.replace(/[{}]/g, '') + '=' + token;
    });
  };

  // 1-Click: Automatically appends as &key={token}
  const appendQueryParam = (key: string, token: string) => {
    setUrlTemplate(prev => {
      if (prev.includes(token)) return prev;
      const separator = prev.includes('?') ? '&' : '?';
      return `${prev}${separator}${key}=${token}`;
    });
  };

  const handleAddNewParam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParamKey.trim() || !newParamName.trim()) return;

    const cleanKey = newParamKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const tokenFormatted = newParamToken.trim().startsWith('{') && newParamToken.trim().endsWith('}')
      ? newParamToken.trim()
      : `{${cleanKey}}`;

    const newParam: CustomParamDefinition = {
      id: `param_${Date.now()}`,
      name: newParamName.trim(),
      param_key: cleanKey,
      token: tokenFormatted,
      default_value: newParamDefault.trim() || undefined,
      category: newParamCategory,
    };

    setCustomParams(prev => [...prev, newParam]);
    setNewParamName('');
    setNewParamKey('');
    setNewParamToken('');
    setNewParamDefault('');
    setShowAddParam(false);
  };

  const handleDeleteParam = (id: string) => {
    setCustomParams(prev => prev.filter(p => p.id !== id));
  };

  // Live compiled preview with all defined parameters
  const generatePreview = () => {
    let result = urlTemplate || '';
    result = result.replace('{master_id}', masterAffId || 'M_AFF_101');
    result = result.replace('{click_id}', 'clk_demo_984');
    result = result.replace('{ref}', 'sub_ali_05');
    result = result.replace('{sku}', 'shoe-99');

    customParams.forEach(p => {
      if (p.token) {
        result = result.replace(new RegExp(p.token.replace(/[{}]/g, '\\$&'), 'g'), p.default_value || p.param_key + '_val');
      }
    });

    return result;
  };

  const previewOutbound = generatePreview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        id: brand?.id,
        brand_name: brandName,
        master_aff_id: masterAffId,
        url_template: urlTemplate,
        click_id_param_key: clickIdParamKey,
        sub_ref_param_key: subRefParamKey,
        postback_secret: postbackSecret,
        custom_params: customParams,
      });
      onClose();
    } catch (err) {
      alert('Error saving brand template: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="panel-3d relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {brand ? 'Edit Brand Store Link Setup' : 'Add New Brand Store Link'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Set up the web link and pick which tracking tags to include when sending visitors to the brand store.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <form id="brandForm" onSubmit={handleSubmit} className="space-y-5">
            {/* Brand Name & Master ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Brand / Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Nike, Apple, Amazon"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-sm"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  The company or affiliate network you are promoting.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Your Account ID with the Brand *
                </label>
                <input
                  type="text"
                  required
                  value={masterAffId}
                  onChange={(e) => setMasterAffId(e.target.value)}
                  placeholder="e.g. M_AFF_101, CJ_MASTER_88"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 shadow-sm"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  This fills the &#123;master_id&#125; tag so the brand pays your main account.
                </span>
              </div>
            </div>

            {/* Destination URL Template */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Brand Store Website Link (with Tags) *
                </label>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  Click "+ Add to Link" in the table below to add any tag automatically
                </span>
              </div>
              <textarea
                required
                rows={2}
                value={urlTemplate}
                onChange={(e) => setUrlTemplate(e.target.value)}
                placeholder="https://brand.com/p/{sku}?partner_id={master_id}&click_ref={click_id}&sub={ref}"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            {/* PARAMETERS SELECTION TABLE (Organized Table instead of cluttered pills!) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TableIcon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Available Link Tags ({customParams.length} Defined)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Click <strong>"+ Add to Link"</strong> to add any tag directly into the link above.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddParam(!showAddParam)}
                  className="btn-3d-indigo flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-sm self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Define New Tag</span>
                </button>
              </div>

              {/* Add Custom Parameter Drawer */}
              {showAddParam && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-500/30 shadow-md space-y-3 animate-in fade-in duration-150">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                    Create a New Custom Link Tag
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                        Tag Name
                      </label>
                      <input
                        type="text"
                        value={newParamName}
                        onChange={(e) => {
                          setNewParamName(e.target.value);
                          if (!newParamKey) {
                            setNewParamKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                            setNewParamToken(`{${e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')}}`);
                          }
                        }}
                        placeholder="e.g. Ad Keyword"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                        Brand URL Query Key
                      </label>
                      <input
                        type="text"
                        value={newParamKey}
                        onChange={(e) => {
                          setNewParamKey(e.target.value);
                          setNewParamToken(`{${e.target.value}}`);
                        }}
                        placeholder="e.g. kw, sub3, c_id"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                        Category
                      </label>
                      <select
                        value={newParamCategory}
                        onChange={(e) => setNewParamCategory(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="custom">Custom Tag</option>
                        <option value="campaign">Campaign / Sub</option>
                        <option value="attribution">Tracking Token</option>
                        <option value="device">Device / Location</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                        Default Test Value
                      </label>
                      <input
                        type="text"
                        value={newParamDefault}
                        onChange={(e) => setNewParamDefault(e.target.value)}
                        placeholder="e.g. shoes"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddParam(false)}
                      className="px-3 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewParam}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                    >
                      Save Tag
                    </button>
                  </div>
                </div>
              )}

              {/* TABLE OF PARAMETERS (Clean, clear, easy to read) */}
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 max-h-56 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-600 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Tag Name</th>
                      <th className="py-2.5 px-2.5">Tag Token</th>
                      <th className="py-2.5 px-2.5">Brand Key</th>
                      <th className="py-2.5 px-2.5">Status in Link</th>
                      <th className="py-2.5 px-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                    {customParams.map((p) => {
                      const isPresentInUrl = urlTemplate.includes(p.token);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                            {p.name}
                          </td>
                          <td className="py-2 px-2.5 text-indigo-600 dark:text-indigo-400 font-bold">
                            {p.token}
                          </td>
                          <td className="py-2 px-2.5 text-slate-600 dark:text-slate-400">
                            &amp;{p.param_key}=...
                          </td>
                          <td className="py-2 px-2.5 font-sans">
                            {isPresentInUrl ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                                <Check className="w-3 h-3" />
                                Added in Link
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">
                                Not added
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-right font-sans">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => appendQueryParam(p.param_key, p.token)}
                                disabled={isPresentInUrl}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                  isPresentInUrl
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    : 'btn-3d-indigo text-white shadow-sm'
                                }`}
                              >
                                {isPresentInUrl ? 'In Link ✓' : '+ Add to Link'}
                              </button>

                              <button
                                type="button"
                                onClick={() => insertToken(p.token)}
                                className="px-2 py-1 rounded-lg text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                title="Insert token at cursor"
                              >
                                Token Only
                              </button>

                              {p.category === 'custom' && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteParam(p.id)}
                                  className="p-1 text-slate-400 hover:text-rose-500"
                                  title="Delete tag"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Click ID & Sub Ref Keys & Postback Secret */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Brand's Tracking Key
                </label>
                <input
                  type="text"
                  required
                  value={clickIdParamKey}
                  onChange={(e) => setClickIdParamKey(e.target.value)}
                  placeholder="click_ref, subId1, subid"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 shadow-sm"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">What the brand calls Click ID</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Brand's Partner Key
                </label>
                <input
                  type="text"
                  required
                  value={subRefParamKey}
                  onChange={(e) => setSubRefParamKey(e.target.value)}
                  placeholder="sub, subId2, utm_source"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 shadow-sm"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">What the brand calls Partner code</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Secret Webhook Password
                </label>
                <input
                  type="text"
                  value={postbackSecret}
                  onChange={(e) => setPostbackSecret(e.target.value)}
                  placeholder="sec_..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 shadow-sm"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Protects against fake sales</span>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-lg text-white">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Preview: How the Link Looks with Real Values</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {customParams.filter(p => urlTemplate.includes(p.token)).length} tags active in link
                </span>
              </div>
              <div className="text-xs font-mono text-emerald-300 break-all select-all bg-black/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed shadow-inner">
                {previewOutbound}
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="brandForm"
            disabled={loading}
            className="btn-3d-indigo px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving Link Setup...' : brand ? 'Save Changes' : 'Create Brand Link'}
          </button>
        </div>
      </div>
    </div>
  );
};
