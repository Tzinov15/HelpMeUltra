import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/api/client'

export interface DetailedSegmentEffort {
  id: number
  name: string
  elapsed_time: number
  moving_time: number
  distance: number
  start_index: number
  end_index: number
  average_heartrate?: number
  max_heartrate?: number
  pr_rank?: number
  kom_rank?: number
}

export interface DetailedActivity {
  id: number
  name: string
  sport_type: string
  type: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  average_speed: number
  average_heartrate?: number
  max_heartrate?: number
  has_heartrate: boolean
  start_date: string
  start_date_local: string
  best_efforts?: DetailedSegmentEffort[]
  splits_metric?: Array<{
    distance: number
    elapsed_time: number
    elevation_difference: number
    moving_time: number
    split: number
    average_speed: number
    average_heartrate?: number
    pace_zone: number
  }>
  calories?: number
  description?: string
  gear?: { name: string }
}

export function useActivityDetail(activityId: number | null) {
  return useQuery({
    queryKey: ['activity', activityId],
    queryFn: () =>
      axiosInstance
        .get<DetailedActivity>(`/activities/${activityId}`, {
          params: { include_all_efforts: true },
        })
        .then((r) => r.data),
    enabled: !!activityId,
  })
}
