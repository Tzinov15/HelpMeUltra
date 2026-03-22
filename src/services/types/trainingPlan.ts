export type WorkoutType = 'run' | 'cycling' | 'strength' | 'yoga' | 'rest'
export type RunType = 'zone1_2' | 'tempo' | 'intervals'

export interface PlannedWorkout {
  id: string
  date: string // YYYY-MM-DD
  type: WorkoutType
  // Run-specific
  runType?: RunType
  miles?: number
  vertFt?: number
  // All types — null means "use auto-estimate"
  overrideMinutes?: number
  notes?: string
}

export interface WeekGoal {
  weekKey: string // YYYY-MM-DD (Monday of that week)
  miles: number
  vertFt: number
  // Zone time goals in minutes (optional)
  zone1_2Minutes?: number
  tempoMinutes?: number
  intervalMinutes?: number
}

export interface TrainingPlan {
  raceId: string
  exportVersion: string // "1.0"
  createdAt: string
  updatedAt: string
  weekGoals: Record<string, WeekGoal> // weekKey → WeekGoal
  workouts: PlannedWorkout[]
}

// ─── Import/Export envelope ───────────────────────────────────────────────────

export interface TrainingPlanExport {
  source: 'HelpMeUltra'
  exportVersion: string
  exportedAt: string
  plan: Omit<TrainingPlan, 'raceId'> // raceId stripped — re-bound on import
}
