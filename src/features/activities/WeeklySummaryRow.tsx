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


// "1:24" (h:mm) for ≥1h, "45:23" (m:ss) for <1h — matches ActivityCard
function formatTimeCompact(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}`
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Renders "4h2m" with h/m as small superscript-style letters
function ZoneTimeValue({ secs, color }: { secs: number; color: string }) {
  if (secs < 30) {
    return <span className={clsx('text-[17px] font-bold leading-none', color)}>—</span>
  }
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return (
    <span className={clsx('tabular-nums font-bold leading-none', color)}>
      {h > 0 && (
        <>
          <span className="text-[17px]">{h}</span>
          <span className="text-[10px]">h</span>
        </>
      )}
      <span className="text-[17px]">{m}</span>
      <span className="text-[10px]">m</span>
    </span>
  )
}

interface Props {
  group: WeekGroup
  /** When false (weekly-only mode), removes sticky positioning */
  sticky: boolean
  /** If provided, renders an expand/collapse toggle on the row */
  onToggle?: () => void
  isExpanded?: boolean
}

export function WeeklySummaryRow({ group, sticky, onToggle, isExpanded = false }: Props) {
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
        sticky && 'sticky top-[76px] z-10',
      )}
    >
      {/* ── LEFT: week label — matches ActivityCard's flex-1 min-w-0 ───── */}
      <div className="min-w-0 flex-1 flex items-center gap-2">
        {onToggle && (
          <button
            onClick={onToggle}
            className="shrink-0 text-hmu-secondary dark:text-gray-400 hover:text-hmu-primary dark:hover:text-white transition-colors"
            title={isExpanded ? 'Collapse week' : 'Expand week'}
          >
            <svg
              className={clsx('h-3.5 w-3.5 transition-transform duration-150', isExpanded && 'rotate-180')}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
        <div
          className={clsx('min-w-0', onToggle && 'cursor-pointer')}
          onClick={onToggle}
        >
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

      {/* ── RIGHT: zone time breakdown — w-60 split into 5 equal columns ── */}
      {/* grid-cols-5 gives each zone exactly 1/5 of the width so values        */}
      {/* always align regardless of whether the value is "6m" or "1h38m".      */}
      <div className="w-72 shrink-0 grid grid-cols-5">
        {group.zoneTimes.map((secs, i) => (
          <div
            key={i}
            className={clsx(
              'flex flex-col items-center gap-0.5 py-0.5',
              i < 4 && 'border-r border-hmu-tertiary dark:border-gray-600 opacity-100',
            )}
          >
            <span className={clsx('text-[10px] font-bold leading-none', ZONE_COLORS_TEXT[i])}>
              Z{i + 1}
            </span>
            <ZoneTimeValue secs={secs} color={ZONE_COLORS_TEXT[i]} />
          </div>
        ))}
      </div>
    </div>
  )
}
