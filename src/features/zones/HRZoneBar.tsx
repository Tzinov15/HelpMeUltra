import { useMemo } from 'react'
import { clsx } from 'clsx'
import type { TimedZoneRange } from './hooks/useActivityZones'

const ZONE_COLORS = ['bg-slate-400', 'bg-blue-400', 'bg-emerald-400', 'bg-orange-400', 'bg-red-400']
const ZONE_LABELS = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5']

interface Props {
  buckets: TimedZoneRange[]
  showLabels?: boolean
  height?: string
}

export function HRZoneBar({ buckets, showLabels = false, height = 'h-3' }: Props) {
  const total = useMemo(() => buckets.reduce((s, b) => s + b.time, 0), [buckets])

  if (total === 0) return <div className={clsx('w-full rounded bg-gray-700', height)} />

  return (
    <div className="w-full">
      <div className={clsx('flex w-full overflow-hidden rounded', height)}>
        {buckets.map((b, i) => {
          const pct = (b.time / total) * 100
          if (pct < 0.5) return null
          return (
            <div
              key={i}
              className={clsx(ZONE_COLORS[i] ?? 'bg-gray-500', 'transition-all')}
              style={{ width: `${pct}%` }}
              title={`${ZONE_LABELS[i]}: ${Math.round(b.time / 60)}min`}
            />
          )
        })}
      </div>
      {showLabels && (
        <div className="mt-1 flex gap-3">
          {buckets.map((b, i) => (
            <span key={i} className="flex items-center gap-1 text-xs text-gray-500">
              <span className={clsx('inline-block h-2 w-2 rounded-sm', ZONE_COLORS[i])} />
              {ZONE_LABELS[i]}: {Math.round(b.time / 60)}m
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
