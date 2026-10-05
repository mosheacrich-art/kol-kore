/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: { md: '3px', lg: '4px', xl: '5px', '2xl': '6px', '3xl': '8px' },
      colors: {
        night: {
          900: '#0d0b1e',
          950: '#07060f',
        },
        canvas:  'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        line:    'var(--border)',
        ink:     'var(--text)',
        'ink-2': 'var(--text-2)',
        'ink-3': 'var(--text-3)',
        'ink-4': 'var(--text-muted)',
        accent:  'rgb(var(--accent-rgb) / <alpha-value>)',
        success: 'rgb(var(--success-rgb) / <alpha-value>)',
        danger:  'rgb(var(--danger-rgb) / <alpha-value>)',
        warning: 'rgb(var(--warning-rgb) / <alpha-value>)',
        'gold-ink': 'var(--text-gold)',
        gold: {
          DEFAULT: 'rgb(var(--gold-rgb) / <alpha-value>)',
          300: '#ffe082',
          400: '#c8941f',
          500: '#ffca28',
          600: '#c8941f',
        },
      },
      fontFamily: {
        sans:  ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'system-ui', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        serif: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'system-ui', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: 'var(--shadow-sm)',
        pop: 'var(--shadow-md)',
        modal: 'var(--shadow-lg)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

