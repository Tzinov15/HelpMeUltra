import { useMemo } from 'react'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import { zonesCache } from '@/lib/stravaCache'
import { ON_FOOT_TYPES } from '@/lib/strava/formatters'
import type { SummaryActivity } from '@/features/activities/hooks/useActivities'

export interface WeekChartPoint {
  weekKey: string
  label: string   // "Mar 3–Mar 9"
  startDate: Date
  /** On-foot miles */
  mileage: number
  /** On-foot elevation in feet */
  elevFt: number
  /** Seconds in each HR zone (Z1-Z5), all activities with HR data */
  zoneTimes: [number, number, number, number, number]
}

/**
 * Aggregates activities into Mon–Sun weeks.
 * Mileage + vert count only on-foot sport types.
 * Zone times are read from zonesCache (same source as HRZoneBar).
 */
export function useWeeklyChartData(activities: SummaryActivity[] | undefined): WeekChartPoint[] {
  return useMemo(() => {
    if (!activities?.length) return []

    const map = new Map<string, WeekChartPoint>()

    for (const a of activities) {
      const date = new Date(a.start_date_local)
      const weekStart = startOfWeek(date, { weekStartsOn: 1 })
      const wk = format(weekStart, 'yyyy-MM-dd')

      if (!map.has(wk)) {
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
        map.set(wk, {
          weekKey: wk,
          label: `${format(weekStart, 'MMM d')}–${format(weekEnd, 'MMM d')}`,
          startDate: weekStart,
          mileage: 0,
          elevFt: 0,
          zoneTimes: [0, 0, 0, 0, 0],
        })
      }

      const pt = map.get(wk)!

      if (ON_FOOT_TYPES.includes(a.sport_type)) {
        pt.mileage += a.distance / 1609.344
        pt.elevFt += a.total_elevation_gain * 3.28084
      }

      if (a.has_heartrate) {
        const zoneData = zonesCache.get(a.id)
        const hrZone = zoneData?.find((z) => z.type === 'heartrate')
        if (hrZone) {
          hrZone.distribution_buckets.forEach((b, i) => {
            if (i < 5) pt.zoneTimes[i] += b.time
          })
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  }, [activities])
}
