/**
 * Tracks Strava API rate-limit state parsed from response headers.
 *
 * Strava returns on every response:
 *   X-RateLimit-Limit:  <15min>,<daily>     e.g. "200,2000"
 *   X-RateLimit-Usage:  <15min>,<daily>     e.g. "195,1200"
 *
 * When a 429 is received, retryAfter is set to the estimated reset time
 * (15 minutes from now, since Strava resets every 15-minute window).
 */

export interface RateLimitState {
  limit15min: number
  limitDaily: number
  used15min: number
  usedDaily: number
  /** Epoch ms when the 15-minute window resets (set on 429) */
  retryAfterMs: number | null
  /** When we last updated from headers */
  updatedAt: number | null
}

let state: RateLimitState = {
  limit15min: 200,
  limitDaily: 2000,
  used15min: 0,
  usedDaily: 0,
  retryAfterMs: null,
  updatedAt: null,
}

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

export function updateFromHeaders(headers: Record<string, string>) {
  const limit = headers['x-ratelimit-limit'] ?? headers['X-RateLimit-Limit']
  const usage = headers['x-ratelimit-usage'] ?? headers['X-RateLimit-Usage']

  if (limit) {
    const [l15, ld] = limit.split(',').map(Number)
    state.limit15min = l15 ?? state.limit15min
    state.limitDaily  = ld  ?? state.limitDaily
  }
  if (usage) {
    const [u15, ud] = usage.split(',').map(Number)
    state.used15min = u15 ?? state.used15min
    state.usedDaily  = ud  ?? state.usedDaily
  }
  state.updatedAt = Date.now()

  console.log(
    `[rate-limit] 15min: ${state.used15min}/${state.limit15min}  daily: ${state.usedDaily}/${state.limitDaily}`
  )
  notify()
}

export function markRateLimited() {
  // Strava windows reset every 15 minutes on the clock
  const now = new Date()
  const msUntilNextWindow =
    (15 - (now.getMinutes() % 15)) * 60 * 1000 - now.getSeconds() * 1000
  state.retryAfterMs = Date.now() + msUntilNextWindow
  console.warn(`[rate-limit] 429 received — retry after ${new Date(state.retryAfterMs).toLocaleTimeString()}`)
  notify()
}

export function clearRateLimited() {
  state.retryAfterMs = null
  notify()
}

export function isRateLimited(): boolean {
  if (state.retryAfterMs === null) return false
  if (Date.now() >= state.retryAfterMs) {
    clearRateLimited()
    return false
  }
  return true
}

export function getState(): Readonly<RateLimitState> {
  return state
}

/** Subscribe to changes — returns unsubscribe fn */
export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
