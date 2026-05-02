/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#F0EEF8',
          100: '#DDD9F0',
          200: '#BBB3E1',
          300: '#998DD2',
          400: '#7768C3',
          500: '#6359A3',
          600: '#544A8F',
          700: '#3E3770',
          800: '#2A2550',
          900: '#161330',
        },
        teal: {
          50:  '#E8F5F5',
          100: '#B9E1E0',
          200: '#8ACDCB',
          300: '#5BB9B6',
          400: '#2DA5A1',
          500: '#2D8887',
          600: '#247170',
          700: '#1B5A59',
          800: '#124342',
          900: '#092C2B',
        },
        surface: {
          primary:   'var(--bg-card-solid)',
          secondary: 'var(--bg-secondary)',
          tertiary:  'var(--bg-input)',
          border:    'var(--border-primary)',
          hover:     'var(--bg-hover)',
        },
      },
      boxShadow: {
        'glass':     'var(--glass-shadow)',
        'ios':       '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'ios-lg':    '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
        'ios-xl':    '0 16px 48px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        'ios': '14px',
        'ios-lg': '20px',
        'ios-xl': '28px',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
