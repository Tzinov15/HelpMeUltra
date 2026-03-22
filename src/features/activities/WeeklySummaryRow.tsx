import { clsx } from 'clsx'
import { STAT_COL } from './ActivityCard'
import type { WeekGroup } from './hooks/useWeeklyGroups'

// Must match HRZoneBar's ZONE_COLORS exactly (bg-slate-400, bg-blue-400, etc.)
const ZONE_COLORS_TEXT = [
  'text-slate-400',
  'text-blue-400',
  'text-emerald-400',
  'text-orange-400',
  'text-red-400',
] as const

// "1h24m" / "45m" / "—" — compact for the zone cells
function formatZoneTime(secs: number): string {
  if (secs < 30) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h${m}m` : `${h}h`
  return `${m}m`
}

// "1:24" (h:mm) for ≥1h, "45:23" (m:ss) for <1h — matches ActivityCard
function formatTimeCompact(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}`
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface Props {
  group: WeekGroup
  /** When false (weekly-only mode), removes sticky positioning */
  sticky: boolean
}

export function WeeklySummaryRow({ group, sticky }: Props) {
  return (
    <div
      className={clsx(
        // Layout — matches ActivityCard's gap-4 px-4
        'flex items-center gap-4 px-4 py-2.5',
        // Visual distinction from activity rows
        'bg-hmu-surface-alt dark:bg-gray-800/70',
        'border-y-2 border-hmu-tertiary dark:border-gray-600',
        'border-l-[3px] border-l-hmu-primary dark:border-l-gray-400',
        // Sticky: sticks at top-9 (36px = height of the column header)
        // Each <section> is the containing block, so the row unsticks naturally
        // when scrolling past the last activity in that week.
        sticky && 'sticky top-9 z-10',
      )}
    >
      {/* ── LEFT: week label — matches ActivityCard's flex-1 min-w-0 ───── */}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold uppercase tracking-wider text-hmu-primary dark:text-gray-100">
          {group.label}
        </div>
        <div className="text-[10px] text-hmu-secondary dark:text-gray-500">
          {group.activities.length} {group.activities.length === 1 ? 'activity' : 'activities'}
          {group.hasPartialZones && (
            <span className="ml-1 opacity-60">· zone data partial</span>
          )}
        </div>
      </div>

      {/* ── CENTER: 7 fixed-width columns matching ActivityCard exactly ── */}
      {/* time | mi | ft | [blank bpm] | [blank pace] | [blank gap] | [blank effort] */}
      <div className="flex shrink-0 items-center">
        {/* time */}
        <div className={clsx(STAT_COL, 'text-center shrink-0')}>
          <div className="text-xl font-bold tabular-nums leading-none text-hmu-primary dark:text-white">
            {formatTimeCompact(group.totalMovingTimeSec)}
          </div>
        </div>

        {/* mi */}
        <div className={clsx(STAT_COL, 'text-center shrink-0')}>
          {group.totalMiles > 0 && (
            <div className="text-xl font-bold tabular-nums leading-none text-hmu-primary dark:text-white">
              {group.totalMiles.toFixed(1)}
            </div>
          )}
        </div>

        {/* ft */}
        <div className={clsx(STAT_COL, 'text-center shrink-0')}>
          {group.totalElevFt > 0 && (
            <div className="text-xl font-bold tabular-nums leading-none text-hmu-primary dark:text-white">
              {Math.round(group.totalElevFt).toLocaleString()}
            </div>
          )}
        </div>

        {/* bpm, pace, gap, effort — blank spacers to preserve column alignment */}
        <div className={STAT_COL} />
        <div className={STAT_COL} />
        <div className={STAT_COL} />
        <div className={STAT_COL} />
      </div>

      {/* ── RIGHT: zone time breakdown — same w-48 as the HR zone bar ─── */}
      <div className="w-48 shrink-0 flex justify-around items-center">
        {group.zoneTimes.map((secs, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span className={clsx('text-[8px] font-bold leading-none', ZONE_COLORS_TEXT[i])}>
              Z{i + 1}
            </span>
            <span className={clsx('text-[10px] tabular-nums font-semibold leading-none', ZONE_COLORS_TEXT[i])}>
              {formatZoneTime(secs)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
