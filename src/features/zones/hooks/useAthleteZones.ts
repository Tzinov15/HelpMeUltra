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
    queryFn: () => axiosInstance.get<AthleteZones>('/athlete/zones').then((r) => r.data),
    staleTime: Infinity,
  })
}
