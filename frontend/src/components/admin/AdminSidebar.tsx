import React from 'react';
import { 
  BarChart3, 
  Link2, 
  Package, 
  Users, 
  Webhook, 
  SlidersHorizontal, 
  Plus, 
  Zap
} from 'lucide-react';

export type AdminModule = 
  | 'stats' 
  | 'url-params' 
  | 'products' 
  | 'sub-affiliates' 
  | 'postback-s2s' 
  | 'attribution-rules';

interface AdminSidebarProps {
  currentModule: AdminModule;
  onSelectModule: (module: AdminModule) => void;
  brandCount: number;
  productCount: number;
  partnerCount: number;
  onQuickCreateBrand: () => void;
  onQuickCreateProduct: () => void;
  onQuickCreatePartner: () => void;
  onOpenSimulator: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentModule,
  onSelectModule,
  brandCount,
  productCount,
  partnerCount,
  onQuickCreateBrand,
  onQuickCreateProduct,
  onQuickCreatePartner,
  onOpenSimulator,
}) => {
  const [createMenuOpen, setCreateMenuOpen] = React.useState(false);

  const navItems: Array<{
    id: AdminModule;
    label: string;
    description: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }> = [
    {
      id: 'stats',
      label: 'Sales & Live Stream',
      description: 'Clicks, sales numbers, and live orders',
      icon: BarChart3,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'url-params',
      label: 'Link Parameters & URLs',
      description: 'Web links, tags, and brand templates',
      icon: Link2,
      badge: brandCount,
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
    },
    {
      id: 'products',
      label: 'Products & Offers',
      description: 'Store items, prices, and commission %',
      icon: Package,
      badge: productCount,
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
    },
    {
      id: 'sub-affiliates',
      label: 'Partners & Influencer Splits',
      description: 'Partner accounts and commission cuts',
      icon: Users,
      badge: partnerCount,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'postback-s2s',
      label: 'Store Webhooks (S2S)',
      description: 'Receive sales notices from brand stores',
      icon: Webhook,
      badge: 'S2S',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    },
    {
      id: 'attribution-rules',
      label: 'Commission Rules & Policies',
      description: 'Simple rules for splits, safety & privacy',
      icon: SlidersHorizontal,
    },
  ];

  return (
    <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 flex flex-col bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/5 dark:shadow-xl transition-colors duration-200">
      {/* Create Config Quick Action Hub */}
      <div className="relative mb-5">
        <button
          onClick={() => setCreateMenuOpen(!createMenuOpen)}
          className="btn-3d-indigo w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all group"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
            <span>Create Config</span>
          </span>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-mono">
            + New
          </span>
        </button>

        {/* Dropdown Options */}
        {createMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-20" 
              onClick={() => setCreateMenuOpen(false)} 
            />
            <div className="absolute top-full left-0 right-0 mt-2 z-30 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  onSelectModule('url-params');
                  onQuickCreateBrand();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
              >
                <Link2 className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Register URL Parameter Def</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Brand URL template &amp; tokens</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  onSelectModule('products');
                  onQuickCreateProduct();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
              >
                <Package className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Add Promotional Product</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Offer SKU, price &amp; commission</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  onSelectModule('sub-affiliates');
                  onQuickCreatePartner();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
              >
                <Users className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Register Sub-Affiliate</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Partner profile &amp; custom split %</div>
                </div>
              </button>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                <button
                  onClick={() => {
                    setCreateMenuOpen(false);
                    onOpenSimulator();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center gap-2.5 transition-colors"
                >
                  <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Simulate S2S Conversion</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Test live webhook postback</div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation Modules */}
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center justify-between">
        <span>Configuration Modules</span>
        <span className="font-mono text-slate-400">6 Modules</span>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all group ${
                isActive
                  ? 'btn-3d-indigo text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:text-indigo-500'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="truncate leading-tight">{item.label}</div>
                  <div className={`text-[10px] font-normal truncate mt-0.5 ${
                    isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {item.description}
                  </div>
                </div>
              </div>

              {item.badge !== undefined && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex-shrink-0 ml-2 shadow-sm ${
                  isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* S2S Status & Diagnostic Badge */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-300 mb-1.5">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Attribution Engine</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">&lt;50ms</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span>S2S Inbound &amp; Postback</span>
            <span className="text-slate-700 dark:text-slate-300 font-mono font-semibold">100% Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
