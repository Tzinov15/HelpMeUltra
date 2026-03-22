const STORAGE_KEY = 'strava_auth'

export interface StoredToken {
  access_token: string
  refresh_token: string
  expires_at: number // unix epoch seconds
  athlete_id: number
}

function get(): StoredToken | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      console.log('[auth] No stored token found')
      return null
    }
    return JSON.parse(raw) as StoredToken
  } catch {
    console.warn('[auth] Failed to parse stored token')
    return null
  }
}

function set(token: StoredToken): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(token))
  const expiresIn = Math.round(token.expires_at - Date.now() / 1000)
  console.log(`[auth] Token stored — athlete_id=${token.athlete_id}, expires in ${expiresIn}s`)
}

function clear(): void {
  localStorage.removeItem(STORAGE_KEY)
  console.log('[auth] Token cleared')
}

function isExpired(token: StoredToken): boolean {
  const expired = Date.now() / 1000 >= token.expires_at - 60
  if (expired) {
    console.log('[auth] Token is expired (or within 60s buffer)')
  }
  return expired
}

async function refresh(token: StoredToken): Promise<StoredToken> {
  console.log('[auth] Refreshing token…')
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_STRAVA_CLIENT_ID,
    client_secret: import.meta.env.VITE_STRAVA_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: token.refresh_token,
  })
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  if (!res.ok) {
    console.error('[auth] Token refresh failed', res.status, res.statusText)
    throw new Error('Token refresh failed')
  }
  const data = await res.json()
  const refreshed: StoredToken = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    athlete_id: token.athlete_id,
  }
  set(refreshed)
  console.log('[auth] Token refreshed successfully')
  return refreshed
}

async function getValidToken(): Promise<string | null> {
  const token = get()
  if (!token) return null
  if (!isExpired(token)) {
    console.log('[auth] Using existing valid token')
    return token.access_token
  }
  try {
    const refreshed = await refresh(token)
    return refreshed.access_token
  } catch {
    console.error('[auth] Could not refresh token — clearing and requiring re-auth')
    clear()
    return null
  }
}

export const tokenStore = { get, set, clear, isExpired, getValidToken }
