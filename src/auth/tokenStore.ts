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
    return raw ? (JSON.parse(raw) as StoredToken) : null
  } catch {
    return null
  }
}

function set(token: StoredToken): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(token))
}

function clear(): void {
  localStorage.removeItem(STORAGE_KEY)
}

function isExpired(token: StoredToken): boolean {
  return Date.now() / 1000 >= token.expires_at - 60 // 60s buffer
}

async function refresh(token: StoredToken): Promise<StoredToken> {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_STRAVA_CLIENT_ID,
    client_secret: import.meta.env.VITE_STRAVA_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: token.refresh_token,
  })
  const res = await fetch(`https://www.strava.com/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  if (!res.ok) throw new Error('Token refresh failed')
  const data = await res.json()
  const refreshed: StoredToken = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    athlete_id: token.athlete_id,
  }
  set(refreshed)
  return refreshed
}

async function getValidToken(): Promise<string | null> {
  const token = get()
  if (!token) return null
  if (!isExpired(token)) return token.access_token
  try {
    const refreshed = await refresh(token)
    return refreshed.access_token
  } catch {
    clear()
    return null
  }
}

export const tokenStore = { get, set, clear, isExpired, getValidToken }
