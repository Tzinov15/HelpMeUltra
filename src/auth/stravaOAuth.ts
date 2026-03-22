const CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID
const CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET
const REDIRECT_URI = import.meta.env.VITE_STRAVA_REDIRECT_URI

const SCOPES = 'read,activity:read_all,profile:read_all'

export function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: SCOPES,
  })
  return `https://www.strava.com/oauth/authorize?${params}`
}

export async function exchangeCode(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_at: number
  athlete: { id: number; firstname: string; lastname: string; profile: string }
}> {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
  })
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'OAuth exchange failed')
  }
  return res.json()
}
