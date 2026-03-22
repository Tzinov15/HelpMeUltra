/**
 * Typed localStorage cache for Strava data.
 *
 * Design goals:
 *  - Zero dependencies — plain JSON in localStorage
 *  - Versioned: bump CACHE_VERSION to invalidate all entries on schema changes
 *  - Two flavours:
 *      SingleCache<T>     — one key, one value  (e.g. the full activities array)
 *      ActivityMapCache<T> — one key per activity id  (e.g. zones, detail)
 *  - Both expose `.get()`, `.set()`, `.has()`, `.clear()`, `.cachedAt()`
 */

const CACHE_VERSION = 'v1'

// ─── Internal envelope ────────────────────────────────────────────────────────

interface CacheEnvelope<T> {
  v: string       // cache version
  ts: number      // ms since epoch when written
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

// ─── SingleCache ──────────────────────────────────────────────────────────────

export class SingleCache<T> {
  constructor(private readonly key: string) {}

  get(): { data: T; ts: number } | null {
    return unwrap<T>(localStorage.getItem(this.key))
  }

  getData(): T | undefined {
    return this.get()?.data
  }

  set(data: T): void {
    localStorage.setItem(this.key, JSON.stringify(wrap(data)))
  }

  has(): boolean {
    return this.get() !== null
  }

  cachedAt(): number | null {
    return this.get()?.ts ?? null
  }

  clear(): void {
    localStorage.removeItem(this.key)
  }
}

// ─── ActivityMapCache ─────────────────────────────────────────────────────────

export class ActivityMapCache<T> {
  constructor(private readonly prefix: string) {}

  private key(id: number): string {
    return `${this.prefix}:${id}`
  }

  get(id: number): T | null {
    return unwrap<T>(localStorage.getItem(this.key(id)))?.data ?? null
  }

  set(id: number, data: T): void {
    localStorage.setItem(this.key(id), JSON.stringify(wrap(data)))
  }

  has(id: number): boolean {
    return this.get(id) !== null
  }

  /** Remove a single entry */
  clear(id: number): void {
    localStorage.removeItem(this.key(id))
  }

  /** Remove all entries whose keys start with this prefix */
  clearAll(): void {
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(this.prefix)) toRemove.push(k)
    }
    toRemove.forEach((k) => localStorage.removeItem(k))
  }

  /** How many ids are cached */
  count(): number {
    let n = 0
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith(this.prefix)) n++
    }
    return n
  }
}

// ─── Named stores (import these everywhere) ───────────────────────────────────

import type { SummaryActivity } from '@/features/activities/hooks/useActivities'
import type { ActivityZone } from '@/features/zones/hooks/useActivityZones'
import type { DetailedActivity } from '@/features/activities/hooks/useActivityDetail'

/** Full paginated list of activities for the lookback window */
export const activitiesCache = new SingleCache<SummaryActivity[]>('strava:activities')

/** Per-activity HR zone distribution  GET /activities/{id}/zones */
export const zonesCache = new ActivityMapCache<ActivityZone[]>('strava:zones')

/** Per-activity detailed data with best_efforts  GET /activities/{id} */
export const detailCache = new ActivityMapCache<DetailedActivity>('strava:detail')
