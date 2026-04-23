/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bricolage Grotesque', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      colors: {
        bg: '#06080b',
        surface: '#0b0f14',
        surface2: '#111722',
        surface3: '#1a2130',
        accent: '#f59e0b',
        accent2: '#3b82f6',
        accent3: '#10b981',
        warn: '#ef4444',
        warn2: '#f97316',
        text: '#f1f5f9',
        text2: '#94a3b8',
        muted: '#475569',
        up: '#10b981',
        down: '#ef4444',
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.3, transform: 'scale(0.6)' },
        },
        'fade-in': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
