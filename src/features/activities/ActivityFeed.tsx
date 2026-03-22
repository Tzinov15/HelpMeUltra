import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ActivityCard } from './ActivityCard'
import { useActivities } from './hooks/useActivities'
import { useZonePreloader } from '@/features/zones/hooks/useZonePreloader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { activitiesCache, zonesCache } from '@/lib/stravaCache'

type Filter = 'all' | 'run' | 'ride'

export function ActivityFeed() {
  const { data: activities, isLoading, error } = useActivities()
  const [filter, setFilter] = useState<Filter>('all')
  const [zoneProgress, setZoneProgress] = useState<{ loaded: number; total: number; done: boolean } | null>(null)

  // Kick off background preloading of all zone data as soon as activities are available
  useZonePreloader(activities, setZoneProgress)

  const filtered = useMemo(() => {
    if (!activities) return []
    switch (filter) {
      case 'run':
        return activities.filter((a) => ['Run', 'TrailRun', 'VirtualRun'].includes(a.sport_type))
      case 'ride':
        return activities.filter((a) =>
          ['Ride', 'MountainBikeRide', 'VirtualRide', 'GravelRide'].includes(a.sport_type)
        )
      default:
        return activities
    }
  }, [activities, filter])

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-400">Loading your activities…</p>
      </div>
    )
  if (error) return <ErrorMessage message="Failed to load activities" />

  const cachedAt = activitiesCache.cachedAt()
  const zonesCached = zonesCache.count()
  const zonesTotal = activities?.filter((a) => a.has_heartrate).length ?? 0

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: `All (${activities?.length ?? 0})` },
    { id: 'run', label: 'Runs' },
    { id: 'ride', label: 'Rides' },
  ]

  return (
    <div className="flex flex-col">

      {/* ── Filter bar + cache status ──────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-800 px-4 py-2">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                filter === f.id
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Cache info */}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          {zoneProgress && !zoneProgress.done && (
            <span className="text-gray-500">
              Loading zones {zoneProgress.loaded}/{zoneProgress.total}…
            </span>
          )}
          {zoneProgress?.done && (
            <span className="text-gray-600">
              {zonesCached}/{zonesTotal} zones cached
            </span>
          )}
          {cachedAt && (
            <span title={new Date(cachedAt).toLocaleString()}>
              Updated {format(new Date(cachedAt), 'MMM d, h:mm a')}
            </span>
          )}
        </div>
      </div>

      {/* ── Activity list ──────────────────────────────────────────────── */}
      <div className="overflow-y-auto">
        {filtered.map((a) => (
          <ActivityCard key={a.id} activity={a} />
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">No activities found</p>
        )}
      </div>

    </div>
  )
}
