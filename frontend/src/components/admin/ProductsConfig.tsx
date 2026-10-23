import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Copy, 
  Check, 
  Edit2, 
  Trash2, 
  X
} from 'lucide-react';
import { Product, BrandParam } from '../../types';
import { createProduct, updateProduct, deleteProduct, toggleProductStatus } from '../../services/api';

interface ProductsConfigProps {
  products: Product[];
  brands: BrandParam[];
  onRefresh: () => void;
}

export const ProductsConfig: React.FC<ProductsConfigProps> = ({
  products,
  brands,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('all');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formBrandId, setFormBrandId] = useState(brands[0]?.id || '');
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDestUrl, setFormDestUrl] = useState('');
  const [formPrice, setFormPrice] = useState('120.00');
  const [formCommPct, setFormCommPct] = useState('12.50');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const origin = window.location.origin;

  const handleCopyLink = (slug: string) => {
    const link = `${origin}/go/${slug}?ref=direct&src=admin_test`;
    navigator.clipboard.writeText(link);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormBrandId(brands[0]?.id || '');
    setFormTitle('');
    setFormSlug('');
    setFormDestUrl('https://brand.com/products/');
    setFormPrice('99.00');
    setFormCommPct('10.00');
    setFormImageUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormBrandId(p.brand_id);
    setFormTitle(p.title);
    setFormSlug(p.slug);
    setFormDestUrl(p.destination_url);
    setFormPrice(String(p.retail_price));
    setFormCommPct(String(p.default_comm_pct));
    setFormImageUrl(p.image_url || '');
    setIsModalOpen(true);
  };

  const handleAutoSlug = (titleText: string) => {
    setFormTitle(titleText);
    if (!editingProduct) {
      const generated = titleText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormSlug(generated);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          brand_id: formBrandId,
          title: formTitle,
          slug: formSlug,
          destination_url: formDestUrl,
          retail_price: parseFloat(formPrice),
          default_comm_pct: parseFloat(formCommPct),
          image_url: formImageUrl || undefined,
        });
      } else {
        await createProduct({
          brand_id: formBrandId,
          title: formTitle,
          slug: formSlug,
          destination_url: formDestUrl,
          retail_price: parseFloat(formPrice),
          default_comm_pct: parseFloat(formCommPct),
          image_url: formImageUrl || undefined,
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      alert('Failed to save product: ' + (err as Error).message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteProduct(id);
        onRefresh();
      } catch (err) {
        alert('Failed to delete product: ' + (err as Error).message);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleProductStatus(id, !currentStatus);
      onRefresh();
    } catch (err) {
      alert('Failed to toggle status: ' + (err as Error).message);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBrand = selectedBrandFilter === 'all' || p.brand_id === selectedBrandFilter;
    return matchesSearch && matchesBrand;
  });

  const activeCount = products.filter(p => p.is_active).length;
  const avgCommission = products.length 
    ? (products.reduce((acc, p) => acc + Number(p.default_comm_pct), 0) / products.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
              <Package className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Products &amp; Promotional Offers Config
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage promotional inventory catalog, destination URLs, retail pricing, and commission percentages.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-3d-emerald flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="panel-3d p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Products</div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">{products.length}</div>
        </div>
        <div className="panel-3d p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Active Offers</div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{activeCount}</div>
        </div>
        <div className="panel-3d p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Avg Commission</div>
          <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">{avgCommission}%</div>
        </div>
        <div className="panel-3d p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Mapped Brands</div>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5">{brands.length}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel-3d rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
              Offer Catalog Registry ({filteredProducts.length})
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 shadow-sm"
            >
              <option value="all">All Brands ({brands.length})</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.brand_name}</option>
              ))}
            </select>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products or slugs..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            No products found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => {
              return (
                <div
                  key={p.id}
                  className="panel-3d rounded-xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-4 hover:border-indigo-400 dark:hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    {/* Top title and brand */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                          {p.title}
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.2 rounded border border-indigo-500/20">
                          {p.brand_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.title)}
                          className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Financial Specs */}
                    <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-lg bg-white/90 dark:bg-black/40 border border-slate-200/90 dark:border-slate-800/80 text-xs shadow-sm">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Retail Price</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">${Number(p.retail_price).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Default Comm</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{p.default_comm_pct}%</span>
                      </div>
                    </div>

                    {/* Inbound Tracking Slug */}
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                      <span className="text-slate-500">Inbound Slug:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">/go/{p.slug}</span>
                    </div>

                    {/* Destination URL */}
                    <div className="p-2 rounded-lg bg-slate-100/90 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 truncate shadow-inner">
                      {p.destination_url}
                    </div>
                  </div>

                  {/* Direct Link One-Click Copy */}
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleToggleStatus(p.id, p.is_active)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        p.is_active
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {p.is_active ? 'Active' : 'Inactive'}
                    </button>

                    <button
                      onClick={() => handleCopyLink(p.slug)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 font-semibold text-[11px] transition-all shadow-sm"
                      title="Copy Direct Master Link"
                    >
                      {copiedSlug === p.slug ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Direct Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="panel-3d relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingProduct ? 'Edit Product & Commission' : 'Add New Promotional Product'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Associated Brand Parameter Definition
                </label>
                <select
                  required
                  value={formBrandId}
                  onChange={(e) => setFormBrandId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.brand_name} ({b.master_aff_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product / Offer Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => handleAutoSlug(e.target.value)}
                  placeholder="e.g. Nike Air Max 270 Sneakers"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Inbound Tracking Slug (/go/{'{slug}'})
                </label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. nike-air-max-270"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-emerald-600 dark:text-emerald-400 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Advertiser Destination URL
                </label>
                <input
                  type="url"
                  required
                  value={formDestUrl}
                  onChange={(e) => setFormDestUrl(e.target.value)}
                  placeholder="https://brand.com/products/shoe-123"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Retail Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Commission (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formCommPct}
                    onChange={(e) => setFormCommPct(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-emerald-600 dark:text-emerald-400 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-3d-emerald px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
