/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tft: {
          bg: '#0b0d1b',
          card: 'rgba(23, 27, 48, 0.85)',
          'card-hover': 'rgba(30, 36, 64, 0.95)',
          border: 'rgba(124, 58, 237, 0.25)',
          'border-focus': 'rgba(124, 58, 237, 0.6)',
          gold: '#fbbf24',
          'gold-glow': 'rgba(251, 191, 36, 0.35)',
          advance: '#10b981',
          repechage: '#f59e0b',
          eliminate: '#ef4444',
          purple: '#7c3aed',
          cyan: '#06b6d4',
          text: '#f8fafc',
          muted: '#94a3b8'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Geist Mono', 'Menlo', 'monospace'],
        sans: ['Geist', 'Outfit', 'Satoshi', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-gold': 'glowGold 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glowGold: {
          '0%': { boxShadow: '0 0 10px rgba(251, 191, 36, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(251, 191, 36, 0.6)' }
        }
      }
    },
  },
  plugins: [],
}
