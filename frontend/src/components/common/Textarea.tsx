import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  helperText,
  error,
  required,
  className = '',
  containerClassName = '',
  id,
  rows = 3,
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-inner">
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          required={required}
          className={`
            w-full rounded-xl text-sm transition-all duration-150
            bg-white dark:bg-slate-900/90
            border ${error ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/20'}
            text-slate-900 dark:text-white placeholder:text-slate-400
            py-2 px-3 focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-950
            ${className}
          `}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-rose-500">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
});

Textarea.displayName = 'Textarea';
