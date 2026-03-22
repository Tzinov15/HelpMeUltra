import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/api/client'

export interface ZoneRange { min: number; max: number }
export interface AthleteZones {
  heart_rate: { custom_zones: boolean; zones: ZoneRange[] }
  power?: { zones: ZoneRange[] }
}

export function useAthleteZones() {
  return useQuery({
    queryKey: ['athlete-zones'],
    queryFn: async () => {
      console.log('[athlete-zones] Fetching athlete HR zones…')
      const data = await axiosInstance.get<AthleteZones>('/athlete/zones').then((r) => r.data)
      console.log('[athlete-zones] ✓ Got zones:', JSON.stringify(data.heart_rate?.zones))
      return data
    },
    staleTime: Infinity,
    retry: (failureCount, error) => {
      // Don't retry on 429 — wait for the rate limit window to reset
      const status = (error as { response?: { status: number } }).response?.status
      if (status === 429) {
        console.warn('[athlete-zones] 429 rate limited — not retrying')
        return false
      }
      console.warn(`[athlete-zones] Retry ${failureCount + 1} after error:`, status)
      return failureCount < 2
    },
  })
}
