import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`border-b border-slate-200 dark:border-slate-800/80 overflow-x-auto no-scrollbar ${className}`}>
      <div className="flex gap-1 min-w-max p-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`
                group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 select-none
                ${isActive
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-200 dark:border-indigo-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                }
              `}
            >
              {Icon && (
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`
                    text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold
                    ${tab.badgeColor || (isActive ? 'bg-indigo-200/60 dark:bg-indigo-800/60 text-indigo-900 dark:text-indigo-200' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300')}
                  `}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
