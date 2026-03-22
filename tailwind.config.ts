import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        zone: {
          1: '#94a3b8', // Recovery - slate
          2: '#60a5fa', // Aerobic - blue
          3: '#34d399', // Tempo - emerald
          4: '#fb923c', // Threshold - orange
          5: '#f87171', // Max - red
        },
      },
    },
  },
  plugins: [],
} satisfies Config
