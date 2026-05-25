module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0055FF',
          hover: '#0040CC',
          active: '#0033A3',
          foreground: '#FFFFFF'
        },
        background: {
          DEFAULT: '#FFFFFF',
          surface: '#F8FAFC',
          hover: '#F1F5F9'
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A'
        },
        success: '#16A34A',
        warning: '#EAB308',
        danger: '#DC2626'
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Figtree', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace']
      }
    }
  },
  plugins: []
};