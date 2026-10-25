import React from 'react';

export interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  containerClassName?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  id,
  containerClassName = '',
}) => {
  const switchId = id || label.toLowerCase().replace(/[^a-z0-9]/g, '-');

  return (
    <div className={`flex items-start justify-between gap-4 py-1.5 ${containerClassName}`}>
      <div className="space-y-0.5">
        <label
          htmlFor={switchId}
          className="text-xs font-semibold text-black dark:text-white cursor-pointer select-none"
        >
          {label}
        </label>
        {description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
          ${checked ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};
