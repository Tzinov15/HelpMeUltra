import { format } from 'date-fns'
import { clsx } from 'clsx'
import { parseLocalDate } from '@/utils/date'
import { HRZoneBar, ZoneTimeGrid } from '@/features/zones/HRZoneBar'
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

function formatPaceShort(secPerMile: number): string {
  if (!isFinite(secPerMile) || secPerMile <= 0) return '--'
  const mins = Math.floor(secPerMile / 60)
  const secs = Math.round(secPerMile % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

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
  /** Hide this stat at < md breakpoint */
  hideOnMobile?: boolean
}

function StatCell({
  value,
  label,
  color = 'text-hmu-primary dark:text-white',
  visible,
  hideOnMobile = false,
}: StatCellProps) {
  return (
    <div
      className={clsx(
        STAT_COL,
        'text-center shrink-0',
        hideOnMobile && 'hidden md:block',
      )}
    >
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

// Inline stat used in the mobile card layout
function MobileStat({
  value,
  label,
  color = 'text-hmu-primary dark:text-white',
  visible,
}: Omit<StatCellProps, 'hideOnMobile'>) {
  if (!visible) return null
  return (
    <div className="flex flex-col items-center text-center">
      <span className={clsx('text-base font-bold tabular-nums leading-none', color)}>{value}</span>
      <span className="mt-0.5 text-[9px] uppercase tracking-wider text-hmu-secondary dark:text-gray-500">
        {label}
      </span>
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
    <>
      {/* ──── DESKTOP (≥ md): single-row layout ──────────────────────── */}
      <div className="hidden md:flex items-center gap-4 border-b border-hmu-tertiary dark:border-gray-800 px-4 py-3 hover:bg-hmu-surface-alt dark:hover:bg-gray-800/50 transition-colors">

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
            {format(parseLocalDate(a.start_date_local), 'EEE, MMM d yyyy')}
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <StatCell value={formatTimeCompact(a.moving_time)} label="time" visible={a.moving_time > 0} />
          <StatCell value={miles ?? ''} label="mi" visible={miles != null} />
          <StatCell value={elevFt != null ? elevFt.toLocaleString() : ''} label="ft" visible={elevFt != null} />
          <StatCell value={hr != null ? hr.toString() : ''} label="bpm" color="text-purple-400" visible={hr != null} />
          <StatCell value={pace != null ? formatPaceShort(pace) : ''} label="pace" color="text-emerald-600 dark:text-emerald-400" visible={pace != null} />
          <StatCell value={gap != null ? formatPaceShort(gap) : ''} label="GAP" color="text-teal-500 dark:text-teal-400" visible={gap != null} />
          <StatCell value={a.suffer_score != null ? a.suffer_score.toString() : ''} label="effort" color="text-hmu-accent dark:text-yellow-400" visible={a.suffer_score != null} />
        </div>

        <div className="w-72 shrink-0">
          {hrZone ? (
            <HRZoneBar buckets={hrZone.distribution_buckets} height="h-4" showValues />
          ) : (
            <div className="h-4 w-full rounded bg-hmu-tertiary dark:bg-gray-800" />
          )}
        </div>
      </div>

      {/* ──── MOBILE (< md): three-line card ──────────────────────────── */}
      <div className="md:hidden flex flex-col gap-2.5 border-b border-hmu-tertiary dark:border-gray-800 px-4 py-3">

        {/* Row 1: title + date */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={sportBadgeColor}>{sportLabel(a.sport_type)}</span>
            <a
              href={`https://www.strava.com/activities/${a.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-[15px] font-semibold text-hmu-primary dark:text-white hover:text-hmu-accent dark:hover:text-orange-400 transition-colors"
            >
              {a.name}
            </a>
          </div>
          <div className="mt-0.5 text-[11px] text-hmu-secondary dark:text-gray-500">
            {format(parseLocalDate(a.start_date_local), 'EEE, MMM d yyyy')}
          </div>
        </div>

        {/* Row 2: time | dist | elev | HR */}
        <div className="flex items-center justify-around border-y border-hmu-tertiary dark:border-gray-800 py-2">
          <MobileStat value={formatTimeCompact(a.moving_time)} label="time" visible={a.moving_time > 0} />
          <MobileStat value={miles ?? ''} label="mi" visible={miles != null} />
          <MobileStat value={elevFt != null ? elevFt.toLocaleString() : ''} label="ft" visible={elevFt != null} />
          <MobileStat value={hr != null ? hr.toString() : ''} label="bpm" color="text-purple-400" visible={hr != null} />
        </div>

        {/* Row 3: zone bar + per-zone times */}
        <div className="flex w-full flex-col gap-1.5">
          {hrZone ? (
            <>
              <HRZoneBar buckets={hrZone.distribution_buckets} height="h-3" />
              <ZoneTimeGrid secsPerZone={hrZone.distribution_buckets.map((b) => b.time)} />
            </>
          ) : (
            <div className="h-3 w-full rounded bg-hmu-tertiary dark:bg-gray-800" />
          )}
        </div>
      </div>
    </>
  )
}
