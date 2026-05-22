import { clsx } from 'clsx'
import { STAT_COL } from './ActivityCard'
import { HRZoneBar } from '@/features/zones/HRZoneBar'
import type { WeekGroup } from './hooks/useWeeklyGroups'

// Must match HRZoneBar's ZONE_COLORS exactly (bg-slate-400, bg-blue-400, etc.)
const ZONE_COLORS_TEXT = [
  'text-slate-400',
  'text-blue-400',
  'text-emerald-400',
  'text-orange-400',
  'text-red-400',
] as const


function formatTimeCompact(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}`
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

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
  const zoneBuckets = group.zoneTimes.map((time) => ({ time, min: 0, max: 0 }))
  const hasAnyZoneData = group.zoneTimes.some((t) => t > 0)

  const containerClasses = clsx(
    'bg-hmu-surface-alt dark:bg-gray-800/70',
    'border-y-2 border-hmu-tertiary dark:border-gray-600',
    'border-l-[3px] border-l-hmu-primary dark:border-l-gray-400',
    sticky && 'sticky top-10 md:top-[76px] z-10',
    onToggle && 'cursor-pointer hover:bg-hmu-surface dark:hover:bg-gray-800',
  )

  const ariaProps = onToggle
    ? {
        onClick: onToggle,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        },
        role: 'button' as const,
        tabIndex: 0,
        'aria-expanded': isExpanded,
        title: isExpanded ? 'Collapse week' : 'Expand week',
      }
    : {}

  return (
    <>
      {/* ──── DESKTOP layout ─────────────────────────────────────────── */}
      <div
        {...ariaProps}
        className={clsx(
          'hidden md:flex items-center gap-4 px-4 py-2.5',
          containerClasses,
        )}
      >
        <div className="min-w-0 flex-1 flex items-center gap-2">
          {onToggle && (
            <span className="shrink-0 text-hmu-secondary dark:text-gray-400" aria-hidden="true">
              <svg
                className={clsx('h-3.5 w-3.5 transition-transform duration-150', isExpanded && 'rotate-180')}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          )}
          <div className="min-w-0">
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

        <div className="flex shrink-0 items-center">
          <div className={clsx(STAT_COL, 'text-center shrink-0')}>
            <div className="text-xl font-bold tabular-nums leading-none text-hmu-primary dark:text-white">
              {formatTimeCompact(group.totalMovingTimeSec)}
            </div>
          </div>
          <div className={clsx(STAT_COL, 'text-center shrink-0')}>
            {group.totalMiles > 0 && (
              <div className="text-xl font-bold tabular-nums leading-none text-hmu-primary dark:text-white">
                {group.totalMiles.toFixed(1)}
              </div>
            )}
          </div>
          <div className={clsx(STAT_COL, 'text-center shrink-0')}>
            {group.totalElevFt > 0 && (
              <div className="text-xl font-bold tabular-nums leading-none text-hmu-primary dark:text-white">
                {Math.round(group.totalElevFt).toLocaleString()}
              </div>
            )}
          </div>
          <div className={STAT_COL} />
          <div className={STAT_COL} />
          <div className={STAT_COL} />
          <div className={STAT_COL} />
        </div>

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

      {/* ──── MOBILE layout ─────────────────────────────────────────── */}
      <div
        {...ariaProps}
        className={clsx(
          'md:hidden flex flex-col gap-2 px-4 py-3',
          containerClasses,
        )}
      >
        {/* Row 1: label + chevron + totals */}
        <div className="flex items-center gap-3">
          {onToggle && (
            <span className="shrink-0 text-hmu-secondary dark:text-gray-400" aria-hidden="true">
              <svg
                className={clsx('h-3.5 w-3.5 transition-transform duration-150', isExpanded && 'rotate-180')}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-hmu-primary dark:text-gray-100">
              {group.label}
            </div>
            <div className="text-[10px] text-hmu-secondary dark:text-gray-500">
              {group.activities.length} {group.activities.length === 1 ? 'activity' : 'activities'}
              {group.hasPartialZones && <span className="ml-1 opacity-60">· partial</span>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-right">
            <div>
              <div className="text-base font-bold tabular-nums leading-none text-hmu-primary dark:text-white">
                {formatTimeCompact(group.totalMovingTimeSec)}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-hmu-secondary dark:text-gray-500">time</div>
            </div>
            {group.totalMiles > 0 && (
              <div>
                <div className="text-base font-bold tabular-nums leading-none text-hmu-primary dark:text-white">
                  {group.totalMiles.toFixed(1)}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-hmu-secondary dark:text-gray-500">mi</div>
              </div>
            )}
            {group.totalElevFt > 0 && (
              <div>
                <div className="text-base font-bold tabular-nums leading-none text-hmu-primary dark:text-white">
                  {Math.round(group.totalElevFt).toLocaleString()}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-hmu-secondary dark:text-gray-500">ft</div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: zone bar full-width */}
        {hasAnyZoneData && (
          <>
            <HRZoneBar buckets={zoneBuckets} height="h-2.5" />

            {/* Row 3: Z1–Z5 totals in 5 equal columns */}
            <div className="grid grid-cols-5">
              {group.zoneTimes.map((secs, i) => (
                <div
                  key={i}
                  className={clsx(
                    'flex flex-col items-center gap-0.5',
                    i < 4 && 'border-r border-hmu-tertiary dark:border-gray-700/50',
                  )}
                >
                  <span className={clsx('text-[10px] font-bold leading-none', ZONE_COLORS_TEXT[i])}>
                    Z{i + 1}
                  </span>
                  <ZoneTimeValue secs={secs} color={ZONE_COLORS_TEXT[i]} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
