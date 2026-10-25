import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  helperText,
  error,
  options,
  required,
  className = '',
  containerClassName = '',
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-bold text-black dark:text-white"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-inner">
        <select
          id={selectId}
          ref={ref}
          required={required}
          className={`
            w-full appearance-none rounded-xl text-sm transition-all duration-150
            bg-white dark:bg-slate-900/90
            border ${error ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/20'}
            text-slate-900 dark:text-white
            py-2 pl-3 pr-10 focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-950
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} {opt.subLabel ? `(${opt.subLabel})` : ''}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-rose-500">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';
