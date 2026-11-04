import React from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';

export interface ToastProps {
  message: string | null;
  type?: 'success' | 'danger' | 'info';
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
}) => {
  if (!message) return null;

  const typeConfig = {
    success: {
      bg: 'bg-emerald-600',
      icon: <Check className="w-4 h-4 text-white" />,
    },
    danger: {
      bg: 'bg-rose-600',
      icon: <AlertCircle className="w-4 h-4 text-white" />,
    },
    info: {
      bg: 'bg-primary',
      icon: <Info className="w-4 h-4 text-white" />,
    },
  }[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 ${typeConfig.bg} text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn transition-all`}
    >
      <span>{typeConfig.icon}</span>
      <span>{message}</span>
    </div>
  );
};

