import { useState, useEffect, useCallback } from 'react'
import type { TrainingPlan, PlannedWorkout, WeekGoal } from '@/services/types/trainingPlan'
import * as svc from '@/services/trainingPlanService'

export function useTrainingPlan(raceId: string | undefined) {
  const [plan, setPlan] = useState<TrainingPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!raceId) { setLoading(false); return }
    svc.getTrainingPlan(raceId).then((p) => { setPlan(p); setLoading(false) })
  }, [raceId])

  const upsertWeekGoal = useCallback(async (goal: WeekGoal) => {
    if (!raceId) return
    await svc.upsertWeekGoal(raceId, goal)
    setPlan((p) => p ? { ...p, weekGoals: { ...p.weekGoals, [goal.weekKey]: goal } } : p)
  }, [raceId])

  const addWorkout = useCallback(async (workout: Omit<PlannedWorkout, 'id'>) => {
    if (!raceId) return null
    const w = await svc.addWorkout(raceId, workout)
    setPlan((p) => p ? { ...p, workouts: [...p.workouts, w] } : p)
    return w
  }, [raceId])

  const updateWorkout = useCallback(async (id: string, updates: Partial<Omit<PlannedWorkout, 'id'>>) => {
    if (!raceId) return
    await svc.updateWorkout(raceId, id, updates)
    setPlan((p) => p ? { ...p, workouts: p.workouts.map((w) => w.id === id ? { ...w, ...updates } : w) } : p)
  }, [raceId])

  const deleteWorkout = useCallback(async (id: string) => {
    if (!raceId) return
    await svc.deleteWorkout(raceId, id)
    setPlan((p) => p ? { ...p, workouts: p.workouts.filter((w) => w.id !== id) } : p)
  }, [raceId])

  const exportPlan = useCallback(() => {
    if (!plan) return
    const json = svc.exportPlanToJSON(plan)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    a.download = `hmu-training-plan.json`
    a.click()
  }, [plan])

  const importPlan = useCallback((jsonStr: string) => {
    if (!raceId) return
    const imported = svc.importPlanFromJSON(raceId, jsonStr)
    setPlan(imported)
  }, [raceId])

  return { plan, loading, upsertWeekGoal, addWorkout, updateWorkout, deleteWorkout, exportPlan, importPlan }
}
