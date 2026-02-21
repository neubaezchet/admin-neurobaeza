/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Segoe UI Variable"', '"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        fluent: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0078D4',    /* Microsoft Blue primary */
          600: '#005a9e',
          700: '#004578',
          800: '#003052',
          900: '#001b2e',
        },
        surface: {
          primary:   '#ffffff',
          secondary: '#fafafa',
          tertiary:  '#f5f5f5',
          border:    '#e5e5e5',
          hover:     '#f0f0f0',
        },
      },
      boxShadow: {
        'fluent-2':  '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)',
        'fluent-4':  '0 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.1)',
        'fluent-8':  '0 4px 8px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.1)',
        'fluent-16': '0 8px 16px rgba(0,0,0,0.06), 0 16px 32px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        'fluent': '8px',
        'fluent-lg': '12px',
      },
    },
  },
  plugins: [],
}
