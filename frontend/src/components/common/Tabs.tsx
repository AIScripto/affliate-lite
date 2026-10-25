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
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-300 dark:border-indigo-500/40'
                  : 'text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                }
              `}
            >
              {Icon && (
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-black dark:group-hover:text-white'
                  }`}
                />
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`
                    text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold
                    ${tab.badgeColor || (isActive ? 'bg-primary text-white' : 'bg-surface-elevated text-fg border border-border-subtle')}
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
