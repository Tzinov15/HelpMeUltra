import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/api/client'
import { oneYearAgoEpoch } from '@/utils/date'
import { activitiesCache } from '@/lib/stravaCache'

export interface SummaryActivity {
  id: number
  name: string
  sport_type: string
  type: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  elev_high?: number
  elev_low?: number
  start_date: string
  start_date_local: string
  average_speed: number
  max_speed: number
  average_heartrate?: number
  max_heartrate?: number
  has_heartrate: boolean
  average_watts?: number
  workout_type?: number
  map?: { summary_polyline?: string }
}

async function fetchAllActivities(): Promise<SummaryActivity[]> {
  const after = oneYearAgoEpoch()
  const all: SummaryActivity[] = []
  let page = 1

  while (true) {
    const { data: batch } = await axiosInstance.get<SummaryActivity[]>('/activities', {
      params: { after, page, per_page: 200 },
    })
    all.push(...batch)
    if (batch.length < 200) break
    page++
  }

  // Newest first
  all.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

  activitiesCache.set(all)
  return all
}

const SIX_HOURS = 6 * 60 * 60 * 1000

export function useActivities() {
  const cached = activitiesCache.get()

  return useQuery({
    queryKey: ['activities', 'all'],
    queryFn: fetchAllActivities,
    // Hydrate immediately from localStorage — no loading spinner on repeat visits
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.ts ?? 0,
    // Consider data fresh for 6 hours; refetch in background after that
    staleTime: SIX_HOURS,
  })
}
