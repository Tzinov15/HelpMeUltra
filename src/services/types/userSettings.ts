/**
 * User-level settings — pace per zone type, GAP adjustment.
 * Stored at 'hmu:user-settings' and applied everywhere estimates are shown.
 */
export interface PaceSettings {
  // Base flat pace in min/mile for each run zone
  zone1_2Pace: number   // default 13
  tempoPace: number     // default 8
  intervalsPace: number // default 10
  cyclingPace: number   // default 4 (min/mile equivalent for time estimate)
  // Grade-adjusted pace: seconds added per 100ft/mile of elevation gain
  // e.g. 12 means +12 sec/mile for every 100ft/mile of grade
  gapSecsPerHundredFtPerMile: number // default 12
}

export const DEFAULT_PACE_SETTINGS: PaceSettings = {
  zone1_2Pace: 13,
  tempoPace: 8,
  intervalsPace: 10,
  cyclingPace: 4,
  gapSecsPerHundredFtPerMile: 12,
}
