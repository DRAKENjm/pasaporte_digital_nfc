/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8ff',
          100: '#d9efff',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // Fondos app (claro / oscuro vía class dark)
        app: {
          bg: 'rgb(var(--app-bg) / <alpha-value>)',
          card: 'rgb(var(--app-card) / <alpha-value>)',
          elevated: 'rgb(var(--app-elevated) / <alpha-value>)',
          border: 'rgb(var(--app-border) / <alpha-value>)',
          muted: 'rgb(var(--app-muted) / <alpha-value>)',
        },
        bronce: { DEFAULT: '#CE8946', soft: '#e8b87a', bg: 'rgba(206,137,70,0.15)' },
        plata: { DEFAULT: '#A8B0B8', soft: '#d0d5da', bg: 'rgba(168,176,184,0.15)' },
        oro: { DEFAULT: '#FFD700', soft: '#ffe566', bg: 'rgba(255,215,0,0.15)' },
        diamante: { DEFAULT: '#08cef1', soft: '#7eebf8', bg: 'rgba(8,206,241,0.15)' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 4px 24px rgba(0,0,0,0.06)',
        card: '0 8px 32px rgba(0,0,0,0.12)',
        glow: '0 0 28px rgba(14,165,233,0.35)',
      },
      minHeight: { touch: '44px' },
      minWidth: { touch: '44px' },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.25s ease-out',
        slideUp: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        scaleIn: 'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
};
