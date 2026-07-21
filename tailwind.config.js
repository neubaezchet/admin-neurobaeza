/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        /* ── Brand: Índigo ── */
        brand: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        /* ── Violeta Accent ── */
        gold: {
          50:  '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
        },
        /* ── Emerald ── */
        emerald: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
        /* ── Obsidian surfaces ── */
        surface: {
          primary:   'var(--bg-card-solid)',
          elevated:  'var(--bg-card-elevated)',
          secondary: 'var(--bg-secondary)',
          tertiary:  'var(--bg-input)',
          border:    'var(--border-primary)',
          hover:     'var(--bg-hover)',
          sidebar:   'var(--bg-sidebar)',
        },
      },
      boxShadow: {
        'glow':    '0 0 24px rgba(79,70,229,0.35)',
        'glow-lg': '0 0 32px rgba(79,70,229,0.55)',
        'card':    '0 4px 20px rgba(15,23,42,0.08)',
        'card-lg': '0 8px 32px rgba(15,23,42,0.10)',
        'gold':    '0 0 20px rgba(124,58,237,0.25)',
        'glass':   '0 16px 48px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.85)',
        'glass-sm': '0 4px 20px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
        'glass-lg': '0 16px 48px rgba(15,23,42,0.14), inset 0 1px 0 rgba(255,255,255,0.5)',
      },
      borderRadius: {
        '2026':    '20px',
        '2026-lg': '28px',
        '2026-xl': '36px',
        'ios':     '16px',
        'ios-lg':  '20px',
        'ios-xl':  '28px',
      },
      animation: {
        'fade-in':    'fadeIn 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'slide-in':   'slideIn 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in':   'scaleIn 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'slide-up':   'slideUp 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'float':      'float 3s ease-in-out infinite',
        'shimmer':    'shimmer 2.5s infinite',
      },
      keyframes: {
        fadeIn:  {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(79,70,229,0)' },
          '50%':      { boxShadow: '0 0 24px 6px rgba(79,70,229,0.25)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-brand':  'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        'gradient-gold':   'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
        'gradient-dark':   'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
        'gradient-card':   'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%)',
      },
    },
  },
  plugins: [],
}
