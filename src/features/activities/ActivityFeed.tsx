import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ActivityCard, STAT_COL } from './ActivityCard'
import { WeeklySummaryRow } from './WeeklySummaryRow'
import { useActivities } from './hooks/useActivities'
import { useWeeklyGroups } from './hooks/useWeeklyGroups'
import { ZoneLegend } from '@/features/zones/ZoneLegend'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { activitiesCache, zonesCache } from '@/lib/stravaCache'
import { ON_FOOT_TYPES, ON_WHEELS_TYPES } from '@/lib/strava/formatters'
import type { ZonePreloadState } from '@/features/zones/hooks/useZonePreloader'

type Filter = 'all' | 'foot' | 'wheels'

interface Props {
  zoneProgress: ZonePreloadState | null
}

export function ActivityFeed({ zoneProgress }: Props) {
  const { data: activities, isLoading, error } = useActivities()

  const [filter, setFilter] = useState<Filter>('foot')
  const [hideRows, setHideRows] = useState<boolean>(() => {
    try { return localStorage.getItem('hmu:hide-rows') === 'true' } catch { return false }
  })
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set())

  function toggleWeek(weekKey: string) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev)
      if (next.has(weekKey)) next.delete(weekKey)
      else next.add(weekKey)
      return next
    })
  }

  const filtered = useMemo(() => {
    if (!activities) return []
    switch (filter) {
      case 'foot':   return activities.filter((a) => ON_FOOT_TYPES.includes(a.sport_type))
      case 'wheels': return activities.filter((a) => ON_WHEELS_TYPES.includes(a.sport_type))
      default:       return activities
    }
  }, [activities, filter])

  // Recomputes whenever zoneProgress.loaded ticks up (new cache data available)
  const weekGroups = useWeeklyGroups(filtered, zoneProgress)

  function toggleHideRows() {
    const next = !hideRows
    setHideRows(next)
    try { localStorage.setItem('hmu:hide-rows', String(next)) } catch { /* ignore */ }
  }

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-hmu-secondary dark:text-gray-400">Loading your activities…</p>
      </div>
    )
  if (error) return <ErrorMessage message="Failed to load activities" />

  const cachedAt = activitiesCache.cachedAt()
  const zonesCached = zonesCache.count()
  const zonesTotal = activities?.filter((a) => a.has_heartrate).length ?? 0
  const isFetchingZones = zoneProgress !== null && !zoneProgress.done

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all',    label: `All (${activities?.length ?? 0})` },
    { id: 'foot',   label: 'On Foot' },
    { id: 'wheels', label: 'On Wheels' },
  ]

  return (
    <div className="flex flex-col">

      {/* ── Sticky header: filter bar + column labels ───────────────────── */}
      {/*
        Combined into one sticky block so both rows stay visible while scrolling.
        Total height: h-10 (filter row, 40px) + h-9 (column labels, 36px) = 76px.
        WeeklySummaryRow uses top-[76px] to stick directly below this.
      */}
      <div className="sticky top-0 z-20 bg-hmu-surface dark:bg-gray-900 shadow-sm">

        {/* Row 1: filters · checkbox · zone legend */}
        <div className="h-10 flex items-center justify-between gap-4 border-b border-hmu-tertiary dark:border-gray-800 px-4">
          <div className="flex items-center gap-3 shrink-0">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f.id
                    ? 'bg-hmu-primary dark:bg-orange-500 text-white'
                    : 'text-hmu-secondary dark:text-gray-500 hover:text-hmu-primary dark:hover:text-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}

            <div className="w-px h-4 bg-hmu-tertiary dark:bg-gray-700" />

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideRows}
                onChange={toggleHideRows}
                className="h-3.5 w-3.5 accent-hmu-primary rounded"
              />
              <span className="text-xs text-hmu-secondary dark:text-gray-500">
                Weekly view only
              </span>
            </label>
          </div>

          <ZoneLegend />
        </div>

        {/* Row 2: column labels */}
        <div className="h-9 flex items-center gap-4 border-b border-hmu-tertiary dark:border-gray-800 px-4">
          <div className="flex-1 min-w-0 text-[10px] font-semibold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
            Activity
          </div>
          <div className="flex shrink-0 items-center">
            <div className={`${STAT_COL} text-center text-[10px] font-semibold uppercase tracking-widest text-hmu-primary dark:text-gray-300`}>Time</div>
            <div className={`${STAT_COL} text-center text-[10px] font-semibold uppercase tracking-widest text-hmu-primary dark:text-gray-300`}>Dist</div>
            <div className={`${STAT_COL} text-center text-[10px] font-semibold uppercase tracking-widest text-hmu-primary dark:text-gray-300`}>Elev</div>
            <div className={`${STAT_COL} text-center text-[10px] font-semibold uppercase tracking-widest text-purple-400`}>HR</div>
            <div className={`${STAT_COL} text-center text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400`}>Pace</div>
            <div className={`${STAT_COL} text-center text-[10px] font-semibold uppercase tracking-widest text-teal-500 dark:text-teal-400`}>GAP</div>
            <div className={`${STAT_COL} text-center text-[10px] font-semibold uppercase tracking-widest text-hmu-accent dark:text-yellow-400`}>Effort</div>
          </div>
          <div className="w-72 shrink-0 text-center text-[10px] font-semibold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
            HR Zones
          </div>
        </div>

      </div>

      {/* ── Cache / loading status bar (scrolls away) ───────────────────── */}
      <div className="flex items-center justify-end gap-4 border-b border-hmu-tertiary dark:border-gray-800 bg-hmu-surface-alt dark:bg-gray-900/40 px-4 py-1.5 text-xs text-hmu-secondary dark:text-gray-600">
        {isFetchingZones && zoneProgress && (
          <>
            <span className="text-hmu-secondary dark:text-gray-500">
              Loading zones {zoneProgress.loaded}/{zoneProgress.total}…
            </span>
            <div className="w-24 rounded-full bg-hmu-tertiary dark:bg-gray-800 h-1">
              <div
                className="rounded-full bg-hmu-primary dark:bg-orange-600 h-1 transition-all duration-300"
                style={{ width: `${(zoneProgress.loaded / zoneProgress.total) * 100}%` }}
              />
            </div>
          </>
        )}
        {!isFetchingZones && zoneProgress?.done && (
          <span>{zonesCached}/{zonesTotal} zones cached</span>
        )}
        {cachedAt && (
          <span title={new Date(cachedAt).toLocaleString()}>
            Updated {format(new Date(cachedAt), 'MMM d, h:mm a')}
          </span>
        )}
      </div>

      {/* ── Week sections ────────────────────────────────────────────────── */}
      {/*
        Each <section> is the CSS containing block for its WeeklySummaryRow's
        sticky positioning. The summary row sticks at top-9 (below the column
        header) and naturally unsticks when the section's bottom edge scrolls
        past that threshold — pushing the next section's row into place.
        No JS/IntersectionObserver needed.
      */}
      {weekGroups.map((group) => {
        const isExpanded = expandedWeeks.has(group.weekKey)
        const showActivities = !hideRows || isExpanded
        return (
          <section key={group.weekKey}>
            <WeeklySummaryRow
              group={group}
              sticky={!hideRows && !isExpanded}
              onToggle={hideRows ? () => toggleWeek(group.weekKey) : undefined}
              isExpanded={isExpanded}
            />
            {showActivities && group.activities.map((a) => (
              <ActivityCard key={a.id} activity={a} />
            ))}
          </section>
        )
      })}

      {weekGroups.length === 0 && (
        <p className="py-10 text-center text-sm text-hmu-secondary dark:text-gray-500">
          No activities found
        </p>
      )}

    </div>
  )
}
