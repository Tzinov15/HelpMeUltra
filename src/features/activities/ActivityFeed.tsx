import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ActivityCard, STAT_COL } from './ActivityCard'
import { useActivities } from './hooks/useActivities'
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
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    if (!activities) return []
    switch (filter) {
      case 'foot':
        return activities.filter((a) => ON_FOOT_TYPES.includes(a.sport_type))
      case 'wheels':
        return activities.filter((a) => ON_WHEELS_TYPES.includes(a.sport_type))
      default:
        return activities
    }
  }, [activities, filter])

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
    { id: 'all', label: `All (${activities?.length ?? 0})` },
    { id: 'foot', label: 'On Foot' },
    { id: 'wheels', label: 'On Wheels' },
  ]

  return (
    <div className="flex flex-col">

      {/* ── Top bar: filters (left) · legend (right) ───────────────────── */}
      <div className="flex items-center justify-between gap-4 border-b border-hmu-tertiary dark:border-gray-800 px-4 py-2">
        <div className="flex gap-2 shrink-0">
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
        </div>

        {/* Zone colour legend */}
        <ZoneLegend />
      </div>

      {/* ── Cache / loading status bar ─────────────────────────────────── */}
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

      {/* ── Activity list ───────────────────────────────────────────────── */}
      <div className="overflow-y-auto">

        {/* Sticky column header — mirrors ActivityCard's 3-section layout exactly */}
        <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-hmu-tertiary dark:border-gray-800 bg-hmu-surface dark:bg-gray-900 px-4 py-1.5">
          {/* LEFT: matches flex-1 min-w-0 */}
          <div className="flex-1 min-w-0 text-[10px] font-semibold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
            Activity
          </div>
          {/* CENTER: 7 stat columns */}
          <div className="flex shrink-0 items-center">
            <div className={`${STAT_COL} text-center text-[10px] font-semibold uppercase tracking-widest text-hmu-primary dark:text-gray-300`}>Time</div>
            <div className={`${STAT_COL} text-center text-[10px] font-semibold uppercase tracking-widest text-hmu-primary dark:text-gray-300`}>Dist</div>
            <div className={`${STAT_COL} text-center text-[10px] font-semibold uppercase tracking-widest text-hmu-primary dark:text-gray-300`}>Elev</div>
            <div className={`${STAT_COL} text-center text-[10px] font-semibold uppercase tracking-widest text-red-400`}>HR</div>
            <div className={`${STAT_COL} text-center text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400`}>Pace</div>
            <div className={`${STAT_COL} text-center text-[10px] font-semibold uppercase tracking-widest text-teal-500 dark:text-teal-400`}>GAP</div>
            <div className={`${STAT_COL} text-center text-[10px] font-semibold uppercase tracking-widest text-hmu-accent dark:text-yellow-400`}>Effort</div>
          </div>
          {/* RIGHT: matches w-48 */}
          <div className="w-48 shrink-0 text-center text-[10px] font-semibold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
            HR Zones
          </div>
        </div>

        {filtered.map((a) => (
          <ActivityCard key={a.id} activity={a} />
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-hmu-secondary dark:text-gray-500">No activities found</p>
        )}
      </div>

    </div>
  )
}
