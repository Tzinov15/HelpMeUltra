import { useMemo } from 'react'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import { zonesCache } from '@/lib/stravaCache'
import type { SummaryActivity } from './useActivities'
import type { ZonePreloadState } from '@/features/zones/hooks/useZonePreloader'

export interface WeekGroup {
  weekKey: string
  label: string
  startDate: Date
  endDate: Date
  activities: SummaryActivity[]
  totalMiles: number
  totalElevFt: number
  totalMovingTimeSec: number
  /** Seconds spent in each zone (index 0–4 = Z1–Z5), from distribution_buckets */
  zoneTimes: [number, number, number, number, number]
  /** True if any HR-enabled activity in the week is missing cached zone data */
  hasPartialZones: boolean
}

/**
 * Groups activities into Mon–Sun weeks and computes aggregate stats.
 * Zone times are read from zonesCache (same source as HRZoneBar), so totals
 * tie out with the per-activity bar charts.
 *
 * `zoneProgress` is used purely as a recompute tick — as zone data loads in,
 * zoneProgress.loaded increments, which triggers this memo to re-read the
 * freshly populated cache.
 */
export function useWeeklyGroups(
  activities: SummaryActivity[] | undefined,
  zoneProgress: ZonePreloadState | null,
): WeekGroup[] {
  const zoneLoaded = zoneProgress?.loaded ?? 0

  return useMemo(() => {
    if (!activities?.length) return []

    const map = new Map<string, WeekGroup>()

    for (const a of activities) {
      const date = new Date(a.start_date_local)
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }) // Monday
      const weekKey = format(weekStart, 'yyyy-MM-dd')

      if (!map.has(weekKey)) {
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 }) // Sunday
        map.set(weekKey, {
          weekKey,
          label: `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`,
          startDate: weekStart,
          endDate: weekEnd,
          activities: [],
          totalMiles: 0,
          totalElevFt: 0,
          totalMovingTimeSec: 0,
          zoneTimes: [0, 0, 0, 0, 0],
          hasPartialZones: false,
        })
      }

      const group = map.get(weekKey)!
      group.activities.push(a)
      if (a.distance > 0) group.totalMiles += a.distance / 1609.344
      group.totalElevFt += a.total_elevation_gain * 3.28084
      group.totalMovingTimeSec += a.moving_time

      // Sum zone times from the same cache that HRZoneBar reads, so they tie out
      if (a.has_heartrate) {
        const zoneData = zonesCache.get(a.id)
        const hrZone = zoneData?.find((z) => z.type === 'heartrate')
        if (hrZone) {
          hrZone.distribution_buckets.forEach((b, i) => {
            if (i < 5) group.zoneTimes[i] += b.time
          })
        } else {
          group.hasPartialZones = true
        }
      }
    }

    // Newest week first (matches activity sort order)
    return Array.from(map.values()).sort(
      (a, b) => b.startDate.getTime() - a.startDate.getTime()
    )
  // zoneLoaded is the tick that signals zonesCache has new data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, zoneLoaded])
}
