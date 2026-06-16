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
        /* ── Brand: Sapphire ── */
        brand: {
          50:  '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49',
        },
        /* ── Champagne Accent ── */
        gold: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
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
        'glow':    '0 0 24px rgba(14,165,233,0.35)',
        'glow-lg': '0 0 32px rgba(14,165,233,0.55)',
        'card':    '0 4px 20px rgba(0,0,0,0.3)',
        'card-lg': '0 8px 32px rgba(0,0,0,0.4)',
        'gold':    '0 0 20px rgba(245,158,11,0.25)',
        'glass':   '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glass-sm': '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        'glass-lg': '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(14,165,233,0)' },
          '50%':      { boxShadow: '0 0 24px 6px rgba(14,165,233,0.25)' },
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
        'gradient-brand':  'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
        'gradient-gold':   'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
        'gradient-dark':   'linear-gradient(135deg, #0B0B10 0%, #050507 100%)',
        'gradient-card':   'linear-gradient(135deg, rgba(18,18,26,0.9) 0%, rgba(26,26,36,0.8) 100%)',
      },
    },
  },
  plugins: [],
}
