/** @type {import('tailwindcss').Config} */
// Colors resolve to CSS variables defined in src/index.css so every utility
// follows the active theme (light / .dark) automatically.
const rgbVar = (name) => `rgb(var(--${name}-rgb) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas:  'var(--bg)',
        sidebar: 'var(--bg-deep)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        line:    'var(--border)',
        'line-soft': 'var(--border-subtle)',
        ink:     'var(--text)',
        'ink-2': 'var(--text-2)',
        'ink-3': 'var(--text-3)',
        'ink-4': 'var(--text-muted)',
        accent:  rgbVar('accent'),
        gold:    rgbVar('gold'),
        'gold-ink': 'var(--text-gold)',
        success: rgbVar('success'),
        danger:  rgbVar('danger'),
        warning: rgbVar('warning'),
        navy: {
          50:  '#F1F4F9',
          100: '#E1E8F2',
          200: '#C3D0E3',
          500: '#123B68',
          600: '#0B315F',
          700: '#082B57',
          800: '#062245',
          900: '#041833',
        },
        parchment: {
          50:  '#FDFAF2',
          100: '#FAF4E4',
          200: '#F3E9CF',
        },
      },
      fontFamily: {
        sans:   ['"Inter Variable"', 'Inter', '"Heebo Variable"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        serif:  ['"Source Serif 4 Variable"', '"Source Serif 4"', 'Georgia', 'serif'],
        hebrew: ['"Frank Ruhl Libre Variable"', '"Taamey Frank CLM"', '"Noto Serif Hebrew"', 'serif'],
        torah:  ['"Taamey Frank CLM"', '"Noto Serif Hebrew"', 'serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'xs':   'var(--shadow-xs)',
        'card': 'var(--shadow-sm)',
        'pop':  'var(--shadow-md)',
        'modal':'var(--shadow-lg)',
      },
      transitionDuration: {
        DEFAULT: '180ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fadeIn 0.25s ease-out both',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
