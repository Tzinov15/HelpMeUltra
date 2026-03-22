import { useMemo } from 'react'
import { parseISO } from 'date-fns'
import type { SummaryActivity } from '@/features/activities/hooks/useActivities'
import { weekKey, weekLabel } from '@/utils/date'

export interface WeekStats {
  key: string
  label: string
  date: Date
  runMiles: number
  rideMiles: number
  totalElevFt: number
  totalMovingTimeSec: number
  activityCount: number
  avgHR?: number
  activities: SummaryActivity[]
}

export function useWeeklyStats(activities: SummaryActivity[] | undefined): WeekStats[] {
  return useMemo(() => {
    if (!activities) return []

    const map = new Map<string, WeekStats>()

    for (const a of activities) {
      const date = parseISO(a.start_date_local)
      const key = weekKey(date)

      if (!map.has(key)) {
        map.set(key, {
          key,
          label: weekLabel(date),
          date,
          runMiles: 0,
          rideMiles: 0,
          totalElevFt: 0,
          totalMovingTimeSec: 0,
          activityCount: 0,
          activities: [],
        })
      }

      const week = map.get(key)!
      const miles = a.distance / 1609.344
      const elevFt = a.total_elevation_gain * 3.28084

      if (['Run', 'TrailRun', 'VirtualRun'].includes(a.sport_type)) week.runMiles += miles
      if (['Ride', 'MountainBikeRide', 'VirtualRide', 'GravelRide'].includes(a.sport_type))
        week.rideMiles += miles

      week.totalElevFt += elevFt
      week.totalMovingTimeSec += a.moving_time
      week.activityCount++
      week.activities.push(a)
    }

    return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [activities])
}
