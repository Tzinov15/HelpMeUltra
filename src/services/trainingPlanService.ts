/**
 * Training Plan Service — localStorage-backed, async API surface.
 * Swap the internals for fetch() calls when a backend is ready.
 */

import type {
  TrainingPlan,
  PlannedWorkout,
  WeekGoal,
  TrainingPlanExport,
} from './types/trainingPlan'

const planKey = (raceId: string) => `hmu:training-plan:${raceId}`

// ─── Internal helpers ─────────────────────────────────────────────────────────

function readPlan(raceId: string): TrainingPlan | null {
  try {
    const raw = localStorage.getItem(planKey(raceId))
    if (!raw) return null
    return JSON.parse(raw) as TrainingPlan
  } catch {
    return null
  }
}

function writePlan(plan: TrainingPlan): void {
  plan.updatedAt = new Date().toISOString()
  localStorage.setItem(planKey(plan.raceId), JSON.stringify(plan))
}

function defaultPlan(raceId: string): TrainingPlan {
  const now = new Date().toISOString()
  return { raceId, exportVersion: '1.0', createdAt: now, updatedAt: now, weekGoals: {}, workouts: [] }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getTrainingPlan(raceId: string): Promise<TrainingPlan> {
  return readPlan(raceId) ?? defaultPlan(raceId)
}

export async function upsertWeekGoal(raceId: string, goal: WeekGoal): Promise<void> {
  const plan = readPlan(raceId) ?? defaultPlan(raceId)
  plan.weekGoals[goal.weekKey] = goal
  writePlan(plan)
}

export async function addWorkout(
  raceId: string,
  workout: Omit<PlannedWorkout, 'id'>
): Promise<PlannedWorkout> {
  const plan = readPlan(raceId) ?? defaultPlan(raceId)
  const w: PlannedWorkout = { ...workout, id: crypto.randomUUID() }
  plan.workouts.push(w)
  writePlan(plan)
  return w
}

export async function updateWorkout(
  raceId: string,
  id: string,
  updates: Partial<Omit<PlannedWorkout, 'id'>>
): Promise<void> {
  const plan = readPlan(raceId) ?? defaultPlan(raceId)
  const idx = plan.workouts.findIndex((w) => w.id === id)
  if (idx !== -1) {
    plan.workouts[idx] = { ...plan.workouts[idx], ...updates }
    writePlan(plan)
  }
}

export async function deleteWorkout(raceId: string, id: string): Promise<void> {
  const plan = readPlan(raceId) ?? defaultPlan(raceId)
  plan.workouts = plan.workouts.filter((w) => w.id !== id)
  writePlan(plan)
}

// ─── Import / Export ──────────────────────────────────────────────────────────

export function exportPlanToJSON(plan: TrainingPlan): string {
  const { raceId: _rid, ...rest } = plan
  const doc: TrainingPlanExport = {
    source: 'HelpMeUltra',
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    plan: rest,
  }
  return JSON.stringify(doc, null, 2)
}

export function importPlanFromJSON(raceId: string, jsonStr: string): TrainingPlan {
  const doc = JSON.parse(jsonStr) as TrainingPlanExport
  if (doc.source !== 'HelpMeUltra') throw new Error('Not a HelpMeUltra training plan')
  const plan: TrainingPlan = { ...doc.plan, raceId, updatedAt: new Date().toISOString() }
  writePlan(plan)
  return plan
}
