import { useSyncExternalStore } from 'react'
import { useAthleteZones } from './hooks/useAthleteZones'
import { getState, subscribe } from '@/lib/rateLimitStore'

const ZONE_COLORS = [
  'bg-slate-400',
  'bg-blue-400',
  'bg-emerald-400',
  'bg-orange-400',
  'bg-red-400',
]

const ZONE_NAMES = ['Recovery', 'Aerobic', 'Tempo', 'Threshold', 'Max']

function formatRange(min: number, max: number): string {
  if (max <= 0) return `${min}+`
  return `${min}–${max}`
}

function RetryMessage() {
  const rl = useSyncExternalStore(subscribe, getState)
  const retryTime = rl.retryAfterMs
    ? new Date(rl.retryAfterMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="flex items-center gap-1.5 rounded border border-red-900/50 bg-red-950/40 px-2.5 py-1">
      <span className="text-red-400 text-xs">⚠</span>
      <span className="text-xs text-red-400">
        Rate limited
        {retryTime ? ` — retry after ${retryTime}` : ''}
      </span>
    </div>
  )
}

function LoadingLegend() {
  return (
    <div className="flex items-center gap-3">
      {ZONE_NAMES.map((_name, i) => (
        <div key={i} className="flex items-center gap-1 opacity-40">
          <span className={`inline-block h-2.5 w-2.5 rounded-sm ${ZONE_COLORS[i]}`} />
          <span className="text-xs text-gray-500">Z{i + 1}</span>
        </div>
      ))}
      <span className="text-xs text-gray-600 animate-pulse">loading zones…</span>
    </div>
  )
}

export function ZoneLegend() {
  const { data: athleteZones, isLoading, error } = useAthleteZones()
  const zones = athleteZones?.heart_rate?.zones

  if (isLoading) return <LoadingLegend />

  if (error || !zones?.length) {
    const status = (error as { response?: { status: number } } | null)?.response?.status
    const is429 = status === 429

    return (
      <div className="flex items-center gap-2">
        {/* Still render greyed-out zone colors so the column isn't blank */}
        <div className="flex items-center gap-1.5 opacity-30">
          {ZONE_NAMES.map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className={`inline-block h-2.5 w-2.5 rounded-sm ${ZONE_COLORS[i]}`} />
              <span className="text-xs text-gray-600">Z{i + 1}</span>
            </div>
          ))}
        </div>
        {is429 ? (
          <RetryMessage />
        ) : (
          <div className="flex items-center gap-1.5 rounded border border-yellow-900/50 bg-yellow-950/40 px-2.5 py-1">
            <span className="text-yellow-400 text-xs">⚠</span>
            <span className="text-xs text-yellow-500">
              Zone ranges unavailable
              {status ? ` (HTTP ${status})` : ''}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {zones.map((z, i) => (
        <div key={i} className="flex items-center gap-1" title={ZONE_NAMES[i]}>
          <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-sm ${ZONE_COLORS[i] ?? 'bg-gray-500'}`} />
          <span className="text-xs text-gray-500">
            <span className="text-gray-400 font-medium">Z{i + 1}</span>
            {' '}
            <span className="tabular-nums text-gray-600">{formatRange(z.min, z.max)}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
