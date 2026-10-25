/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'border-subtle': 'var(--color-border-subtle)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          hover: 'var(--color-success-hover)',
        },
        info: 'var(--color-info)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        fg: {
          DEFAULT: 'var(--color-fg)',
          heading: 'var(--color-fg-heading)',
          muted: 'var(--color-fg-muted)',
          subtle: 'var(--color-fg-subtle)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -3px rgba(108, 92, 231, 0.35)',
        'glow-success': '0 0 20px -3px rgba(46, 204, 113, 0.35)',
      }
    },
  },
  plugins: [],
}
