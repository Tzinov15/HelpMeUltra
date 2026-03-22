export const ZONE_COLORS = {
  1: { bg: '#94a3b8', text: '#1e293b', label: 'Z1 Recovery' },
  2: { bg: '#60a5fa', text: '#1e3a5f', label: 'Z2 Aerobic' },
  3: { bg: '#34d399', text: '#064e3b', label: 'Z3 Tempo' },
  4: { bg: '#fb923c', text: '#7c2d12', label: 'Z4 Threshold' },
  5: { bg: '#f87171', text: '#7f1d1d', label: 'Z5 Max' },
} as const

export const ZONE_BG_TAILWIND = [
  'bg-zone-1', 'bg-zone-2', 'bg-zone-3', 'bg-zone-4', 'bg-zone-5',
]
