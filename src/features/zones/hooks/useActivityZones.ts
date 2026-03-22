import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/api/client'
import { zonesCache } from '@/lib/stravaCache'

export interface TimedZoneRange {
  min: number
  max: number
  time: number // seconds in this zone
}

export interface ActivityZone {
  score: number
  distribution_buckets: TimedZoneRange[]
  type: 'heartrate' | 'power'
  sensor_based: boolean
  points: number
  custom_zones: boolean
  max: number
}

async function fetchActivityZones(id: number): Promise<ActivityZone[]> {
  // Check localStorage first — zone data never changes
  const cached = zonesCache.get(id)
  if (cached) return cached

  const { data } = await axiosInstance.get<ActivityZone[]>(`/activities/${id}/zones`)
  zonesCache.set(id, data)
  return data
}

export function useActivityZones(activityId: number | null) {
  return useQuery({
    queryKey: ['activity-zones', activityId],
    queryFn: () => fetchActivityZones(activityId!),
    enabled: activityId !== null,
    staleTime: Infinity, // zone data is immutable
    gcTime: Infinity,
  })
}
