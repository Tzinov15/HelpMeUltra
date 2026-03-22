// Pace: seconds per mile → "MM:SS /mi"
export function formatPace(secPerMile: number): string {
  if (!isFinite(secPerMile) || secPerMile <= 0) return '--'
  const mins = Math.floor(secPerMile / 60)
  const secs = Math.round(secPerMile % 60)
  return `${mins}:${secs.toString().padStart(2, '0')} /mi`
}

// Speed m/s → pace in sec/mile
export function speedToPaceSecPerMile(mps: number): number {
  if (!mps || mps <= 0) return Infinity
  const milesPerSec = mps / 1609.344
  return 1 / milesPerSec
}

// Meters → miles string
export function metersToMiles(m: number): string {
  return (m / 1609.344).toFixed(2)
}

// Meters → feet string
export function metersToFeet(m: number): string {
  return Math.round(m * 3.28084).toLocaleString()
}

// Seconds → "H:MM:SS" or "MM:SS"
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Sport type → human label
export function sportLabel(sportType: string): string {
  const map: Record<string, string> = {
    Run: 'Run',
    TrailRun: 'Trail Run',
    VirtualRun: 'Virtual Run',
    Ride: 'Ride',
    MountainBikeRide: 'MTB',
    VirtualRide: 'Virtual Ride',
    GravelRide: 'Gravel',
    EBikeRide: 'E-Bike',
    Velomobile: 'Velomobile',
    Swim: 'Swim',
    Walk: 'Walk',
    Hike: 'Hike',
    StairStepper: 'Stairs',
    RockClimbing: 'Climbing',
    Yoga: 'Yoga',
    WeightTraining: 'Weights',
    Workout: 'Workout',
  }
  return map[sportType] ?? sportType
}

export const ON_FOOT_TYPES = ['Run', 'TrailRun', 'VirtualRun', 'Hike', 'Walk', 'StairStepper', 'RockClimbing']
export const ON_WHEELS_TYPES = ['Ride', 'MountainBikeRide', 'VirtualRide', 'GravelRide', 'EBikeRide', 'Velomobile']

export function isRun(sportType: string): boolean {
  return ['Run', 'TrailRun', 'VirtualRun'].includes(sportType)
}

export function isTrailRun(sportType: string): boolean {
  return sportType === 'TrailRun'
}

export function isRide(sportType: string): boolean {
  return ON_WHEELS_TYPES.includes(sportType)
}

export function isOnFoot(sportType: string): boolean {
  return ON_FOOT_TYPES.includes(sportType)
}

export function isOnWheels(sportType: string): boolean {
  return ON_WHEELS_TYPES.includes(sportType)
}
