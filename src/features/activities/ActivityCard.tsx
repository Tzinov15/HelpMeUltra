import { format, parseISO } from 'date-fns'
import { clsx } from 'clsx'
import { HRZoneBar } from '@/features/zones/HRZoneBar'
import { useActivityZones } from '@/features/zones/hooks/useActivityZones'
import {
  formatPace,
  speedToPaceSecPerMile,
  sportLabel,
  isRun,
  isRide,
} from '@/lib/strava/formatters'
import type { SummaryActivity } from './hooks/useActivities'

interface Props {
  activity: SummaryActivity
}

interface StatProps {
  value: string
  label: string
  color?: string
}

function Stat({ value, label, color = 'text-white' }: StatProps) {
  return (
    <div className="text-center">
      <div className={clsx('text-2xl font-bold tabular-nums leading-none', color)}>
        {value}
      </div>
      <div className="mt-0.5 text-xs text-gray-500">{label}</div>
    </div>
  )
}

export function ActivityCard({ activity: a }: Props) {
  // Always enabled — returns from React Query cache (set by preloader) or
  // localStorage cache instantly; only hits the network if neither is warm
  const { data: zones } = useActivityZones(a.has_heartrate ? a.id : null)
  const hrZone = zones?.find((z) => z.type === 'heartrate')

  const pace = isRun(a.sport_type) ? speedToPaceSecPerMile(a.average_speed) : null
  const miles = (a.distance / 1609.344).toFixed(1)
  const elevFt = Math.round(a.total_elevation_gain * 3.28084)

  const sportBadgeColor = clsx(
    'inline-block rounded px-1.5 py-0.5 text-xs font-medium shrink-0',
    isRun(a.sport_type)
      ? 'bg-orange-900 text-orange-300'
      : isRide(a.sport_type)
        ? 'bg-blue-900 text-blue-300'
        : 'bg-gray-700 text-gray-300'
  )

  return (
    <div className="flex items-center gap-4 border-b border-gray-800 px-4 py-3 hover:bg-gray-800/50 transition-colors">

      {/* ── LEFT: identity ─────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={sportBadgeColor}>{sportLabel(a.sport_type)}</span>
          <span className="truncate text-sm font-medium text-white">{a.name}</span>
        </div>
        <div className="mt-0.5 text-xs text-gray-500">
          {format(parseISO(a.start_date_local), 'EEE, MMM d yyyy')}
        </div>
      </div>

      {/* ── CENTER: hero stats ─────────────────────────────────────────── */}
      <div className="flex shrink-0 items-end gap-5 px-4">
        <Stat value={miles} label="mi" />

        {elevFt > 0 && (
          <Stat value={elevFt.toLocaleString()} label="ft" />
        )}

        {a.average_heartrate != null && (
          <Stat
            value={Math.round(a.average_heartrate).toString()}
            label="bpm"
            color="text-red-400"
          />
        )}

        {pace != null && isFinite(pace) && (
          <Stat value={formatPace(pace)} label="pace" color="text-emerald-400" />
        )}
      </div>

      {/* ── RIGHT: HR zone bar ─────────────────────────────────────────── */}
      <div className="w-48 shrink-0">
        {hrZone ? (
          <HRZoneBar buckets={hrZone.distribution_buckets} height="h-4" />
        ) : (
          // Placeholder keeps column width stable while loading / no HR
          <div className="h-4 w-full rounded bg-gray-800" />
        )}
      </div>

    </div>
  )
}
