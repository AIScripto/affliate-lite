import React from 'react';

export interface TitleBarProps {
  title: string;
  badge?: string;
  subtitle: string;
  action?: React.ReactNode;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title,
  badge,
  subtitle,
  action,
}) => {
  return (
    <div className="titlebar-3d-gradient rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-xs">
            {title}
          </h1>
          {badge && (
            <span className="px-2 py-0.5 rounded-md bg-white/20 border border-white/25 text-[10px] font-bold text-white uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-white/80 mt-1 font-medium">
          {subtitle}
        </p>
      </div>

      {action && <div>{action}</div>}
    </div>
  );
};

