import { speedToPaceSecPerMile } from '@/lib/strava/formatters'

// Grade Adjusted Pace multiplier (Minetti 2002 approximation)
// grade is fractional (0.1 = 10% grade)
export function gapMultiplier(gradeDecimal: number): number {
  const g = Math.max(-0.45, Math.min(0.45, gradeDecimal))
  // Simplified Minetti formula
  return 1 + 4.03 * g + 17.9 * g * g
}

// Estimate GAP for a best effort given overall activity elevation context
export function estimateGAP(
  elapsedTimeSec: number,
  distanceMeters: number,
  activityElevGainM: number,
  activityDistanceM: number
): number {
  // pace in sec/mile
  const pace = speedToPaceSecPerMile(distanceMeters / elapsedTimeSec)
  // estimated grade from overall activity
  const grade = activityDistanceM > 0 ? activityElevGainM / activityDistanceM : 0
  return pace / gapMultiplier(grade)
}

// Composite "strongest mile" score — higher is better
// Rewards fast GAP and lower HR
export function strengthScore(
  gapSecPerMile: number,
  avgHR: number | undefined,
  referenceGAP: number,
  referenceHR: number
): number {
  const paceScore = referenceGAP / Math.max(gapSecPerMile, 1)
  const hrScore = avgHR && avgHR > 0 ? referenceHR / avgHR : 1
  return paceScore * Math.sqrt(hrScore)
}
