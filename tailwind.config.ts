import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        // ── HelpMeUltra brand palette ───────────────────────────────────────
        // Derived from the logo: warm cream background, olive greens, golden accent
        hmu: {
          bg:          '#FEFAF3', // warm cream — page background
          primary:     '#566827', // dark olive green — header, buttons, headings
          'primary-dk':'#3D4A1A', // deeper olive — hover on primary bg
          secondary:   '#8B9953', // medium olive — secondary text, inactive
          tertiary:    '#DBC292', // warm tan — borders, dividers
          accent:      '#E9BE77', // golden yellow — highlights, active states
          surface:     '#FFFFFF', // white — cards, panels
          'surface-alt':'#F5EFE3', // tinted cream — hover, stats bar
        },

        // ── HR zone palette ─────────────────────────────────────────────────
        zone: {
          1: '#94a3b8', // Recovery  — slate
          2: '#60a5fa', // Aerobic   — blue
          3: '#34d399', // Tempo     — emerald
          4: '#fb923c', // Threshold — orange
          5: '#f87171', // Max       — red
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },

  plugins: [],
} satisfies Config
