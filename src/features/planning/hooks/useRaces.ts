import { useState, useEffect, useCallback } from 'react'
import type { Race, RaceInput, RaceUpdate } from '@/services/types/race'
import * as raceService from '@/services/raceService'

interface UseRacesResult {
  races: Race[]
  mainRace: Race | null
  loading: boolean
  addRace: (input: RaceInput) => Promise<Race>
  editRace: (id: string, updates: RaceUpdate) => Promise<Race>
  removeRace: (id: string) => Promise<void>
  makeMain: (id: string) => Promise<Race>
}

export function useRaces(): UseRacesResult {
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    raceService.getRaces()
      .then((data) => {
        console.log('[useRaces] loaded races:', data)
        setRaces(data)
      })
      .catch((err) => {
        console.error('[useRaces] failed to load races:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const addRace = useCallback(async (input: RaceInput) => {
    const race = await raceService.saveRace(input)
    setRaces((prev) => [...prev, race])
    return race
  }, [])

  const editRace = useCallback(async (id: string, updates: RaceUpdate) => {
    const race = await raceService.updateRace(id, updates)
    setRaces((prev) => prev.map((r) => (r.id === id ? race : r)))
    return race
  }, [])

  const removeRace = useCallback(async (id: string) => {
    const wasMain = races.find((r) => r.id === id)?.isMain ?? false
    await raceService.deleteRace(id)
    setRaces((prev) => {
      const filtered = prev.filter((r) => r.id !== id)
      if (wasMain && filtered.length > 0) {
        return filtered.map((r, i) => (i === 0 ? { ...r, isMain: true } : r))
      }
      return filtered
    })
  }, [races])

  const makeMain = useCallback(async (id: string) => {
    const race = await raceService.setMainRace(id)
    setRaces((prev) => prev.map((r) => ({ ...r, isMain: r.id === id })))
    return race
  }, [])

  // Fallback: if no race is explicitly marked main, treat the first one as main.
  // Handles data saved before isMain existed or any other integrity gap.
  const mainRace = races.find((r) => r.isMain) ?? races[0] ?? null

  return { races, mainRace, loading, addRace, editRace, removeRace, makeMain }
}
