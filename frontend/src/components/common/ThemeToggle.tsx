import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="relative flex items-center justify-between w-14 h-7 p-1 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/60 dark:from-slate-900 dark:to-[#0B0F19] dark:border-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_1px_2px_rgba(255,255,255,0.05)] group"
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label="Toggle Theme"
    >
      <Moon className={`w-3.5 h-3.5 transition-all duration-300 ${isDark ? 'text-indigo-400 opacity-100 scale-100 ml-1' : 'text-slate-500 opacity-40 scale-75'}`} />
      <Sun className={`w-3.5 h-3.5 transition-all duration-300 ${!isDark ? 'text-amber-400 opacity-100 scale-100 mr-1' : 'text-slate-600 opacity-40 scale-75'}`} />

      {/* 3D Thumb Pill */}
      <span
        className={`absolute top-0.5 bottom-0.5 w-6 rounded-full transition-all duration-300 ease-out flex items-center justify-center bg-gradient-to-tr shadow-md ${
          isDark 
            ? 'left-0.5 from-indigo-500 to-indigo-600 text-white shadow-indigo-500/40' 
            : 'left-[calc(100%-1.625rem)] from-amber-400 to-amber-500 text-amber-950 shadow-amber-500/40'
        }`}
      >
        {isDark ? (
          <Moon className="w-3 h-3 text-white fill-white" />
        ) : (
          <Sun className="w-3 h-3 text-white fill-white" />
        )}
      </span>
    </button>
  );
};
