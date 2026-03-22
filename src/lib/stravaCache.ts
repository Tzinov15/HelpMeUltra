/**
 * Typed localStorage cache for Strava data.
 *
 * Design:
 *  - Zero dependencies — plain JSON in localStorage
 *  - Versioned: bump CACHE_VERSION to invalidate all entries on schema changes
 *  - Two factory functions:
 *      makeSingleCache<T>      — one key, one value  (e.g. the full activities array)
 *      makeActivityMapCache<T> — one key per activity id  (e.g. zones, detail)
 */

import type { SummaryActivity } from '@/features/activities/hooks/useActivities'
import type { ActivityZone } from '@/features/zones/hooks/useActivityZones'
import type { DetailedActivity } from '@/features/activities/hooks/useActivityDetail'

const CACHE_VERSION = 'v1'

// ─── Internal envelope ────────────────────────────────────────────────────────

interface CacheEnvelope<T> {
  v: string    // schema version — bump to bust all entries
  ts: number   // ms since epoch when written
  data: T
}

function wrap<T>(data: T): CacheEnvelope<T> {
  return { v: CACHE_VERSION, ts: Date.now(), data }
}

function unwrap<T>(raw: string | null): { data: T; ts: number } | null {
  if (!raw) return null
  try {
    const env = JSON.parse(raw) as CacheEnvelope<T>
    if (env.v !== CACHE_VERSION) return null
    return { data: env.data, ts: env.ts }
  } catch {
    return null
  }
}

// ─── SingleCache factory ──────────────────────────────────────────────────────

export interface SingleCache<T> {
  get(): { data: T; ts: number } | null
  getData(): T | undefined
  set(data: T): void
  has(): boolean
  cachedAt(): number | null
  clear(): void
}

export function makeSingleCache<T>(key: string): SingleCache<T> {
  return {
    get() {
      return unwrap<T>(localStorage.getItem(key))
    },
    getData() {
      return unwrap<T>(localStorage.getItem(key))?.data
    },
    set(data: T) {
      localStorage.setItem(key, JSON.stringify(wrap(data)))
    },
    has() {
      return unwrap<T>(localStorage.getItem(key)) !== null
    },
    cachedAt() {
      return unwrap<T>(localStorage.getItem(key))?.ts ?? null
    },
    clear() {
      localStorage.removeItem(key)
    },
  }
}

// ─── ActivityMapCache factory ─────────────────────────────────────────────────

export interface ActivityMapCache<T> {
  get(id: number): T | null
  set(id: number, data: T): void
  has(id: number): boolean
  clear(id: number): void
  clearAll(): void
  count(): number
}

export function makeActivityMapCache<T>(prefix: string): ActivityMapCache<T> {
  const key = (id: number) => `${prefix}:${id}`

  return {
    get(id) {
      return unwrap<T>(localStorage.getItem(key(id)))?.data ?? null
    },
    set(id, data) {
      localStorage.setItem(key(id), JSON.stringify(wrap(data)))
    },
    has(id) {
      return unwrap<T>(localStorage.getItem(key(id))) !== null
    },
    clear(id) {
      localStorage.removeItem(key(id))
    },
    clearAll() {
      const toRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k?.startsWith(prefix)) toRemove.push(k)
      }
      toRemove.forEach((k) => localStorage.removeItem(k))
    },
    count() {
      let n = 0
      for (let i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i)?.startsWith(prefix)) n++
      }
      return n
    },
  }
}

// ─── Named stores (import these everywhere) ───────────────────────────────────

/** Full paginated activity list for the lookback window */
export const activitiesCache = makeSingleCache<SummaryActivity[]>('strava:activities')

/** Per-activity HR zone distribution  (GET /activities/{id}/zones) */
export const zonesCache = makeActivityMapCache<ActivityZone[]>('strava:zones')

/** Per-activity detail with best_efforts  (GET /activities/{id}) */
export const detailCache = makeActivityMapCache<DetailedActivity>('strava:detail')
