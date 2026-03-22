import { useMemo } from 'react'
import { parseISO } from 'date-fns'
import type { DetailedActivity, DetailedSegmentEffort } from '@/features/activities/hooks/useActivityDetail'
import { estimateGAP, strengthScore } from '@/utils/activityUtils'

export interface StrongestMileEntry {
  activityId: number
  activityName: string
  date: Date
  effort: DetailedSegmentEffort
  paceSecPerMile: number
  gapSecPerMile: number
  elevGainFt: number
  avgHR?: number
  score: number
  isPR: boolean
}

export function useStrongestMile(
  detailedActivities: Array<{ activity: DetailedActivity }> | undefined
): StrongestMileEntry[] {
  return useMemo(() => {
    if (!detailedActivities?.length) return []

    const entries: StrongestMileEntry[] = []

    for (const { activity } of detailedActivities) {
      if (!['TrailRun', 'Run'].includes(activity.sport_type)) continue
      const mileBestEffort = activity.best_efforts?.find((e) => e.name === '1 mile')
      if (!mileBestEffort) continue

      const distM = mileBestEffort.distance || 1609.344
      const paceSecPerMile = (mileBestEffort.elapsed_time / distM) * 1609.344
      const gap = estimateGAP(
        mileBestEffort.elapsed_time,
        distM,
        activity.total_elevation_gain,
        activity.distance
      )

      entries.push({
        activityId: activity.id,
        activityName: activity.name,
        date: parseISO(activity.start_date_local),
        effort: mileBestEffort,
        paceSecPerMile,
        gapSecPerMile: gap,
        elevGainFt: activity.total_elevation_gain * 3.28084,
        avgHR: mileBestEffort.average_heartrate ?? activity.average_heartrate,
        score: 0, // fill in after
        isPR: mileBestEffort.pr_rank === 1,
      })
    }

    if (!entries.length) return []

    // Compute reference values for normalization (median)
    const sortedGAP = [...entries].sort((a, b) => a.gapSecPerMile - b.gapSecPerMile)
    const refGAP = sortedGAP[Math.floor(sortedGAP.length / 2)].gapSecPerMile
    const hrsWithData = entries.filter((e) => e.avgHR).map((e) => e.avgHR!)
    const refHR = hrsWithData.length
      ? hrsWithData.reduce((a, b) => a + b, 0) / hrsWithData.length
      : 150

    return entries
      .map((e) => ({
        ...e,
        score: strengthScore(e.gapSecPerMile, e.avgHR, refGAP, refHR),
      }))
      .sort((a, b) => b.score - a.score)
  }, [detailedActivities])
}
