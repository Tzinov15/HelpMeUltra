import { format, parseISO } from 'date-fns'
import { clsx } from 'clsx'
import { HRZoneBar } from '@/features/zones/HRZoneBar'
import { useActivityZones } from '@/features/zones/hooks/useActivityZones'
import {
  speedToPaceSecPerMile,
  sportLabel,
  isOnFoot,
  isOnWheels,
} from '@/lib/strava/formatters'
import type { SummaryActivity } from './hooks/useActivities'

interface Props {
  activity: SummaryActivity
}

// Each stat column width — must match STAT_HEADERS in ActivityFeed
export const STAT_COL = 'w-[72px]'

// "12:57" with no trailing unit (unit goes in label row)
function formatPaceShort(secPerMile: number): string {
  if (!isFinite(secPerMile) || secPerMile <= 0) return '--'
  const mins = Math.floor(secPerMile / 60)
  const secs = Math.round(secPerMile % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// "1:24" (h:mm) for > 1h, "45:23" (m:ss) for < 1h
function formatTimeCompact(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}`
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface StatCellProps {
  value: string
  label: string
  color?: string
  visible: boolean
}

// Fixed-width cell — always reserves space even when content is absent
function StatCell({ value, label, color = 'text-hmu-primary dark:text-white', visible }: StatCellProps) {
  return (
    <div className={clsx(STAT_COL, 'text-center shrink-0')}>
      {visible && (
        <>
          <div className={clsx('text-2xl font-bold tabular-nums leading-none', color)}>
            {value}
          </div>
          <div className="mt-0.5 text-[10px] text-hmu-secondary dark:text-gray-500">{label}</div>
        </>
      )}
    </div>
  )
}

export function ActivityCard({ activity: a }: Props) {
  const { data: zones } = useActivityZones(a.has_heartrate ? a.id : null)
  const hrZone = zones?.find((z) => z.type === 'heartrate')

  const miles       = a.distance > 0 ? (a.distance / 1609.344).toFixed(1) : null
  const elevFt      = a.total_elevation_gain > 0 ? Math.round(a.total_elevation_gain * 3.28084) : null
  const hr          = a.average_heartrate != null ? Math.round(a.average_heartrate) : null
  const paceRaw     = isOnFoot(a.sport_type) && a.average_speed > 0
    ? speedToPaceSecPerMile(a.average_speed) : null
  const pace        = paceRaw != null && isFinite(paceRaw) ? paceRaw : null
  const gapRaw      = isOnFoot(a.sport_type) && a.average_grade_adjusted_speed && a.average_grade_adjusted_speed > 0
    ? speedToPaceSecPerMile(a.average_grade_adjusted_speed) : null
  const gap         = gapRaw != null && isFinite(gapRaw) ? gapRaw : null

  const sportBadgeColor = clsx(
    'inline-block rounded px-1.5 py-0.5 text-xs font-medium shrink-0',
    isOnFoot(a.sport_type)
      ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
      : isOnWheels(a.sport_type)
        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
        : 'bg-hmu-surface-alt dark:bg-gray-700 text-hmu-secondary dark:text-gray-300'
  )

  return (
    <div className="flex items-center gap-4 border-b border-hmu-tertiary dark:border-gray-800 px-4 py-3 hover:bg-hmu-surface-alt dark:hover:bg-gray-800/50 transition-colors">

      {/* ── LEFT: identity ─────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={sportBadgeColor}>{sportLabel(a.sport_type)}</span>
          <a
            href={`https://www.strava.com/activities/${a.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-base font-semibold text-hmu-primary dark:text-white hover:text-hmu-accent dark:hover:text-orange-400 hover:underline transition-colors"
          >
            {a.name}
          </a>
        </div>
        <div className="mt-0.5 text-xs text-hmu-secondary dark:text-gray-500">
          {format(parseISO(a.start_date_local), 'EEE, MMM d yyyy')}
        </div>
      </div>

      {/* ── CENTER: fixed 7-column stat grid ───────────────────────────── */}
      {/* time | mi | ft | bpm | pace | GAP | effort — blanks preserve layout */}
      <div className="flex shrink-0 items-center">
        <StatCell
          value={formatTimeCompact(a.moving_time)}
          label="time"
          color="text-hmu-primary dark:text-white"
          visible={a.moving_time > 0}
        />
        <StatCell
          value={miles ?? ''}
          label="mi"
          visible={miles != null}
        />
        <StatCell
          value={elevFt != null ? elevFt.toLocaleString() : ''}
          label="ft"
          visible={elevFt != null}
        />
        <StatCell
          value={hr != null ? hr.toString() : ''}
          label="bpm"
          color="text-red-400"
          visible={hr != null}
        />
        <StatCell
          value={pace != null ? formatPaceShort(pace) : ''}
          label="pace"
          color="text-emerald-600 dark:text-emerald-400"
          visible={pace != null}
        />
        <StatCell
          value={gap != null ? formatPaceShort(gap) : ''}
          label="GAP"
          color="text-teal-500 dark:text-teal-400"
          visible={gap != null}
        />
        <StatCell
          value={a.suffer_score != null ? a.suffer_score.toString() : ''}
          label="effort"
          color="text-hmu-accent dark:text-yellow-400"
          visible={a.suffer_score != null}
        />
      </div>

      {/* ── RIGHT: HR zone bar ─────────────────────────────────────────── */}
      <div className="w-48 shrink-0">
        {hrZone ? (
          <HRZoneBar buckets={hrZone.distribution_buckets} height="h-4" />
        ) : (
          <div className="h-4 w-full rounded bg-hmu-tertiary dark:bg-gray-800" />
        )}
      </div>

    </div>
  )
}
