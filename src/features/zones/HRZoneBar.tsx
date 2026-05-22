import { useMemo } from 'react'
import { clsx } from 'clsx'
import type { TimedZoneRange } from './hooks/useActivityZones'

const ZONE_COLORS = ['bg-slate-400', 'bg-blue-400', 'bg-emerald-400', 'bg-orange-400', 'bg-red-400']
const ZONE_TEXT_COLORS = ['text-slate-400', 'text-blue-400', 'text-emerald-400', 'text-orange-400', 'text-red-400']
const ZONE_LABELS = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5']

interface Props {
  buckets: TimedZoneRange[]
  showLabels?: boolean
  /** When true, renders the per-zone time above the bar in 5 equal columns */
  showValues?: boolean
  height?: string
}

function formatZoneTime(secs: number): string {
  if (secs < 30) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h${m}m` : `${m}m`
}

/**
 * 5-column Z1–Z5 grid showing each zone's label + time. Used below
 * mobile zone bars (activity row + weekly summary).
 */
export function ZoneTimeGrid({ secsPerZone }: { secsPerZone: number[] }) {
  return (
    <div className="grid grid-cols-5">
      {[0, 1, 2, 3, 4].map((i) => {
        const secs = secsPerZone[i] ?? 0
        const dim = secs < 30
        return (
          <div
            key={i}
            className={clsx(
              'flex flex-col items-center gap-0.5',
              i < 4 && 'border-r border-hmu-tertiary dark:border-gray-700/50',
            )}
          >
            <span className={clsx('text-[10px] font-bold leading-none', ZONE_TEXT_COLORS[i])}>
              Z{i + 1}
            </span>
            <span
              className={clsx(
                'text-[13px] font-bold tabular-nums leading-none',
                ZONE_TEXT_COLORS[i],
                dim && 'opacity-50',
              )}
            >
              {formatZoneTime(secs)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function HRZoneBar({ buckets, showLabels = false, showValues = false, height = 'h-3' }: Props) {
  const total = useMemo(() => buckets.reduce((s, b) => s + b.time, 0), [buckets])

  if (total === 0) return <div className={clsx('w-full rounded bg-hmu-tertiary dark:bg-gray-700', height)} />

  return (
    <div className="w-full">
      {showValues && (
        <div className="relative mb-1 h-3 w-full">
          {(() => {
            let cum = 0
            return [0, 1, 2, 3, 4].map((i) => {
              const secs = buckets[i]?.time ?? 0
              const startPct = (cum / total) * 100
              cum += secs
              // Right-anchor labels near the end of the bar so they don't overflow
              const flipRight = startPct > 85
              return (
                <span
                  key={i}
                  className={clsx(
                    'absolute top-0 text-[10px] font-semibold tabular-nums leading-none',
                    ZONE_TEXT_COLORS[i],
                    secs < 30 && 'opacity-50',
                  )}
                  style={{
                    left: `${startPct}%`,
                    transform: flipRight ? 'translateX(-100%)' : undefined,
                    paddingLeft: flipRight ? 0 : 2,
                    paddingRight: flipRight ? 2 : 0,
                  }}
                >
                  {formatZoneTime(secs)}
                </span>
              )
            })
          })()}
        </div>
      )}
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
            <span key={i} className="flex items-center gap-1 text-xs text-hmu-secondary dark:text-gray-500">
              <span className={clsx('inline-block h-2 w-2 rounded-sm', ZONE_COLORS[i])} />
              {ZONE_LABELS[i]}: {Math.round(b.time / 60)}m
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
