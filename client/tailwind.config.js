/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest:  { DEFAULT: '#1a2b5e', light: '#2a3d7c', dark: '#0f1a3d' },
        gold:    { DEFAULT: '#C9A84C', light: '#DFC070', dark: '#A0832A' },
        ivory:   { DEFAULT: '#FAF7F0', warm: '#F0EBE0' },
        charcoal:{ DEFAULT: '#1a2440', light: '#243060' },
        mist:    '#8FA8C8',
        danger:  '#C0392B',
        success: '#1A7A4A',
        warning: '#D4860A',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        'forest-glow': 'radial-gradient(ellipse at 50% 0%, #2a3d7c 0%, #1a2b5e 60%)',
        'gold-glow': 'radial-gradient(ellipse at 50% 50%, #DFC070 0%, #C9A84C 70%)',
      },
      boxShadow: {
        'gold':   '0 0 24px rgba(201,168,76,0.25), 0 4px 16px rgba(0,0,0,0.3)',
        'card':   '0 2px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
        'deep':   '0 8px 40px rgba(0,0,0,0.25)',
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'reaction':   'reactionPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 20px rgba(201,168,76,0.2)' },
          '50%':     { boxShadow: '0 0 40px rgba(201,168,76,0.5)' },
        },
        reactionPop: {
          from: { opacity: '0', transform: 'scale(0.5) translateY(10px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};