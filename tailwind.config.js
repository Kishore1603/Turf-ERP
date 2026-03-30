/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark': {
          DEFAULT: '#050814',
          secondary: '#0a0f1e',
          tertiary: '#0f172a',
          card: '#0d1226',
        },
        'glass': {
          DEFAULT: 'rgba(255,255,255,0.04)',
          hover: 'rgba(255,255,255,0.07)',
          border: 'rgba(255,255,255,0.08)',
          border2: 'rgba(255,255,255,0.15)',
        },
        'accent': {
          cyan: '#06b6d4',
          'cyan-light': '#22d3ee',
          purple: '#8b5cf6',
          'purple-light': '#a78bfa',
          green: '#10b981',
          'green-light': '#34d399',
          amber: '#f59e0b',
          'amber-light': '#fbbf24',
          red: '#ef4444',
        },
      },
      backgroundImage: {
        'app-gradient': 'radial-gradient(ellipse at top left, #0d1a3a 0%, #050814 50%, #050814 100%)',
        'glass-card': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        'cyan-glow': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        'purple-glow': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        'green-glow': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'amber-glow': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'red-glow': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6,182,212,0.25), 0 0 40px rgba(6,182,212,0.1)',
        'glow-purple': '0 0 20px rgba(139,92,246,0.25), 0 0 40px rgba(139,92,246,0.1)',
        'glow-green': '0 0 20px rgba(16,185,129,0.25), 0 0 40px rgba(16,185,129,0.1)',
        'glow-amber': '0 0 20px rgba(245,158,11,0.25)',
        'glass': '0 8px 32px rgba(0,0,0,0.4)',
        'glass-lg': '0 16px 48px rgba(0,0,0,0.5)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(6,182,212,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(6,182,212,0.6)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
