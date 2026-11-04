import React from 'react';
import { LucideIcon } from 'lucide-react';
import { MetricColor, METRIC_COLOR_STYLES } from '../../constants/theme';

export interface MetricTileProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle: string;
  icon: LucideIcon;
  color?: MetricColor;
  badge?: {
    text: string;
    pulse?: boolean;
  };
}

export const MetricTile: React.FC<MetricTileProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  color = 'indigo',
  badge,
}) => {
  const style = METRIC_COLOR_STYLES[color] || METRIC_COLOR_STYLES.indigo;

  return (
    <div className={`${style.containerClass} p-5`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-fg">
          {title}
        </span>
        <div
          className={`w-8 h-8 rounded-xl ${style.iconBgClass} ${style.iconTextClass} border flex items-center justify-center shadow-sm`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <span
          className={`text-3xl font-black tabular-nums tracking-tight ${style.valueColorClass || 'text-fg'}`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[11px] font-semibold text-fg-muted">
            {unit}
          </span>
        )}
        {badge && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs ${style.badgeClass || 'bg-primary/10 text-primary border border-primary/20'}`}
          >
            {badge.pulse && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block animate-pulse" />
            )}
            {badge.text}
          </span>
        )}
      </div>

      <p className="text-[11px] text-fg-muted mt-1 font-medium">
        {subtitle}
      </p>
    </div>
  );
};

