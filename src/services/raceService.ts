/**
 * Race Service — API layer for race data.
 *
 * All functions are async with clean signatures so this module can be
 * swapped for real fetch() calls when a backend exists.
 * Current implementation: localStorage.
 */

import type { Race, RaceInput, RaceUpdate } from './types/race'

const STORAGE_KEY = 'hmu:races'

// ─── Internal storage helpers ─────────────────────────────────────────────────

function readAll(): Race[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    console.error('[raceService] JSON.parse failed — clearing corrupt data.', err)
    localStorage.removeItem(STORAGE_KEY)
    return []
  }

  if (!Array.isArray(parsed)) {
    console.error('[raceService] stored value is not an array:', typeof parsed)
    return []
  }

  const races = parsed as Race[]

  // Integrity: if no race is marked main, promote the first one
  if (races.length > 0 && !races.some((r) => r.isMain)) {
    races[0] = { ...races[0], isMain: true }
    writeAll(races)
  }

  return races
}

function writeAll(races: Race[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(races))
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getRaces(): Promise<Race[]> {
  return readAll()
}

export async function getRaceById(id: string): Promise<Race | null> {
  return readAll().find((r) => r.id === id) ?? null
}

export async function getMainRace(): Promise<Race | null> {
  return readAll().find((r) => r.isMain) ?? null
}

export async function saveRace(input: RaceInput): Promise<Race> {
  const races = readAll()
  const race: Race = {
    ...input,
    id: crypto.randomUUID(),
    isMain: races.length === 0, // first race is automatically main
    createdAt: new Date().toISOString(),
  }
  writeAll([...races, race])
  return race
}

export async function updateRace(id: string, updates: RaceUpdate): Promise<Race> {
  const races = readAll()
  const idx = races.findIndex((r) => r.id === id)
  if (idx === -1) throw new Error(`Race not found: ${id}`)
  const updated = { ...races[idx], ...updates }
  races[idx] = updated
  writeAll(races)
  return updated
}

export async function deleteRace(id: string): Promise<void> {
  const races = readAll()
  const wasMain = races.find((r) => r.id === id)?.isMain ?? false
  const filtered = races.filter((r) => r.id !== id)
  if (wasMain && filtered.length > 0) {
    filtered[0] = { ...filtered[0], isMain: true }
  }
  writeAll(filtered)
}

export async function setMainRace(id: string): Promise<Race> {
  const races = readAll()
  const updated = races.map((r) => ({ ...r, isMain: r.id === id }))
  writeAll(updated)
  const race = updated.find((r) => r.id === id)
  if (!race) throw new Error(`Race not found: ${id}`)
  return race
}
