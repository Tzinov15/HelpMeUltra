import { useMemo } from 'react'

const VIEW_W = 1440
const VIEW_H = 700
const LINE_COUNT = 24
const SPACING = VIEW_H / (LINE_COUNT + 2)

/**
 * Generates a smooth organic contour-line path using quadratic bezier midpoints.
 * Multiple sine harmonics at different frequencies create natural topo-map undulation.
 */
function makePath(baseY: number, seed: number): string {
  const steps = 20
  const pts: [number, number][] = []

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = -50 + t * (VIEW_W + 100) // extend past both edges
    const y =
      baseY +
      Math.sin(t * Math.PI * 2 * 1.9 + seed) * 22 +
      Math.sin(t * Math.PI * 2 * 3.7 + seed * 1.6) * 13 +
      Math.sin(t * Math.PI * 2 * 0.7 + seed * 0.4) * 35 +
      Math.sin(t * Math.PI * 2 * 7.3 + seed * 2.2) * 6
    pts.push([x, y])
  }

  // Smooth through points using quadratic bezier with midpoint control
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const mx = ((pts[i - 1][0] + pts[i][0]) / 2).toFixed(1)
    const my = ((pts[i - 1][1] + pts[i][1]) / 2).toFixed(1)
    d += ` Q ${pts[i - 1][0].toFixed(1)} ${pts[i - 1][1].toFixed(1)}, ${mx} ${my}`
  }
  d += ` L ${pts[pts.length - 1][0].toFixed(1)} ${pts[pts.length - 1][1].toFixed(1)}`
  return d
}

export function TopoBackground() {
  const lines = useMemo(() => {
    return Array.from({ length: LINE_COUNT }, (_, i) => {
      const baseY = (i + 1.5) * SPACING
      const seed = (i + 1) * Math.PI * 0.618 // golden-angle offset per line
      const isBold = i % 5 === 4
      return { path: makePath(baseY, seed), bold: isBold, id: i }
    })
  }, [])

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {lines.map(({ path, bold, id }) => (
        <path
          key={id}
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={bold ? 1.5 : 0.8}
          opacity={bold ? 0.16 : 0.09}
        />
      ))}
    </svg>
  )
}
