import axios, { type AxiosRequestConfig } from 'axios'
import { tokenStore } from '@/auth/tokenStore'
import { updateFromHeaders, markRateLimited } from '@/lib/rateLimitStore'

const BASE_URL = 'https://www.strava.com/api/v3'

export const axiosInstance = axios.create({ baseURL: BASE_URL })

// ── Request interceptor ───────────────────────────────────────────────────────

axiosInstance.interceptors.request.use(async (config) => {
  const token = await tokenStore.getValidToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    console.warn('[api] No valid token — request will be unauthorized', config.url)
  }

  console.log(
    `[api] → ${config.method?.toUpperCase()} ${config.url}`,
    config.params ? config.params : ''
  )

  return config
})

// ── Response interceptor ──────────────────────────────────────────────────────

axiosInstance.interceptors.response.use(
  (response) => {
    // Parse Strava rate-limit headers on every successful response
    updateFromHeaders(response.headers as Record<string, string>)

    console.log(
      `[api] ← ${response.status} ${response.config.url}`,
      `(${Array.isArray(response.data) ? response.data.length + ' items' : typeof response.data})`
    )

    return response
  },
  (error) => {
    const status: number | undefined = error.response?.status
    const url: string = error.config?.url ?? '?'

    if (status === 429) {
      markRateLimited()
      console.error(`[api] ✗ 429 Rate limited on ${url} — check rateLimitStore for retry time`)
    } else if (status === 401) {
      console.error(`[api] ✗ 401 Unauthorized on ${url} — token may be invalid`)
    } else if (status === 403) {
      console.error(`[api] ✗ 403 Forbidden on ${url} — check OAuth scopes`)
    } else {
      console.error(`[api] ✗ ${status ?? 'network error'} on ${url}`, error.message)
    }

    return Promise.reject(error)
  }
)

// ── Orval custom mutator ──────────────────────────────────────────────────────
// Orval calls this for every generated hook instead of raw fetch.

export const stravaAxiosInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  return axiosInstance(config).then((res) => res.data)
}
