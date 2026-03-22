import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/api/client'

export interface Athlete {
  id: number
  firstname: string
  lastname: string
  profile: string
  profile_medium: string
  city?: string
  state?: string
  country?: string
  sex?: string
  weight?: number
  ftp?: number
  measurement_preference: 'feet' | 'meters'
}

export function useAthlete() {
  return useQuery({
    queryKey: ['athlete'],
    queryFn: () => axiosInstance.get<Athlete>('/athlete').then((r) => r.data),
    staleTime: Infinity,
  })
}

export function useAthleteStats(athleteId: number | undefined) {
  return useQuery({
    queryKey: ['athlete-stats', athleteId],
    queryFn: () =>
      axiosInstance.get(`/athletes/${athleteId}/stats`).then((r) => r.data),
    enabled: !!athleteId,
    staleTime: 30 * 60 * 1000,
  })
}
