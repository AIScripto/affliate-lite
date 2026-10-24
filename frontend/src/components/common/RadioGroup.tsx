import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  dotColor?: string;
  badge?: string;
}

export interface RadioGroupProps {
  label?: string;
  helperText?: string;
  error?: string;
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'pills' | 'cards' | 'segmented';
  containerClassName?: string;
  disabled?: boolean;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  helperText,
  error,
  name,
  options,
  value,
  onChange,
  variant = 'pills',
  containerClassName = '',
  disabled = false,
}) => {
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      {variant === 'segmented' ? (
        <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 gap-1">
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                disabled={disabled}
                onClick={() => onChange(opt.value)}
                className={`
                  flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5
                  ${isSelected
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }
                  ${disabled ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                {opt.dotColor && <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />}
                <span>{opt.label}</span>
                {opt.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-mono">
                    {opt.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : variant === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <div
                key={opt.value}
                onClick={() => !disabled && onChange(opt.value)}
                className={`
                  cursor-pointer p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between
                  ${isSelected
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-500 shadow-sm ring-1 ring-indigo-400'
                    : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }
                  ${disabled ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={name}
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => onChange(opt.value)}
                      disabled={disabled}
                      className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {opt.label}
                    </span>
                  </div>
                  {opt.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      {opt.badge}
                    </span>
                  )}
                </div>
                {opt.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal pl-5">
                    {opt.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                disabled={disabled}
                onClick={() => onChange(opt.value)}
                className={`
                  px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 flex items-center gap-2
                  ${isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }
                  ${disabled ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                {opt.dotColor && <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {error ? (
        <p className="text-[11px] font-medium text-rose-500">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};
