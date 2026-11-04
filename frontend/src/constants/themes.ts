/**
 * Theme Definitions & Palettes - Single Source of Truth
 * Modelled after modern ERP Design Guidelines with Multicolor Support.
 */

export type Theme =
  | 'light'
  | 'dark'
  | 'indigo'
  | 'emerald'
  | 'ocean'
  | 'rose'
  | 'amber'
  | 'slate'
  | 'violet'
  | 'teal'
  | 'midnight';

export interface ThemeOption {
  value: Theme;
  label: string;
  desc: string;
  emoji: string;
  preview: [string, string, string];
  isDark?: boolean;
}

export const THEMES_LIST: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    desc: 'Clean classic workspace for daytime use',
    emoji: '☀️',
    preview: ['#ffffff', '#4f46e5', '#f4f6fb'],
    isDark: false,
  },
  {
    value: 'dark',
    label: 'Dark',
    desc: 'Low-glare dark workspace for dim rooms',
    emoji: '🌙',
    preview: ['#0b0e14', '#6366f1', '#121620'],
    isDark: true,
  },
  {
    value: 'indigo',
    label: 'Indigo',
    desc: 'Deep slate & vibrant royal indigo',
    emoji: '💜',
    preview: ['#0f172a', '#6366f1', '#f0f4ff'],
    isDark: false,
  },
  {
    value: 'emerald',
    label: 'Emerald',
    desc: 'Forest deep & refreshing mint emerald',
    emoji: '💚',
    preview: ['#064e3b', '#10b981', '#f0fdf4'],
    isDark: false,
  },
  {
    value: 'ocean',
    label: 'Ocean',
    desc: 'Midnight navy & pacific sky blue',
    emoji: '🌊',
    preview: ['#0c1a2e', '#0ea5e9', '#f0f9ff'],
    isDark: false,
  },
  {
    value: 'rose',
    label: 'Rose',
    desc: 'Crimson night & radiant rose',
    emoji: '🌹',
    preview: ['#1a0a0f', '#f43f5e', '#fff1f2'],
    isDark: false,
  },
  {
    value: 'amber',
    label: 'Amber',
    desc: 'Warm espresso & sunlit golden amber',
    emoji: '🌅',
    preview: ['#1c1007', '#f59e0b', '#fffbeb'],
    isDark: false,
  },
  {
    value: 'slate',
    label: 'Slate',
    desc: 'Executive carbon & modern neutral slate',
    emoji: '🏢',
    preview: ['#0f172a', '#64748b', '#f8fafc'],
    isDark: false,
  },
  {
    value: 'violet',
    label: 'Violet',
    desc: 'Royal purple & deep amethyst radiance',
    emoji: '👑',
    preview: ['#1e112a', '#8b5cf6', '#faf5ff'],
    isDark: false,
  },
  {
    value: 'teal',
    label: 'Teal',
    desc: 'Glacier mist & deep turquoise',
    emoji: '🪸',
    preview: ['#042f2e', '#14b8a6', '#f0fdfa'],
    isDark: false,
  },
  {
    value: 'midnight',
    label: 'Midnight OLED',
    desc: 'Pure pitch black OLED with electric azure',
    emoji: '🌌',
    preview: ['#000000', '#38bdf8', '#09090b'],
    isDark: true,
  },
];

export const THEME_IDS: Theme[] = THEMES_LIST.map((t) => t.value);

export const THEME_MAP: Record<Theme, ThemeOption> = THEMES_LIST.reduce(
  (acc, item) => {
    acc[item.value] = item;
    return acc;
  },
  {} as Record<Theme, ThemeOption>
);

export const DEFAULT_THEME: Theme = 'dark';

