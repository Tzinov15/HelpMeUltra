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
  suffer_score?: number
  average_grade_adjusted_speed?: number
  map?: { summary_polyline?: string }
}

async function fetchAllActivities(): Promise<SummaryActivity[]> {
  const after = oneYearAgoEpoch()
  const all: SummaryActivity[] = []
  let page = 1

  console.log(`[activities] Fetching all activities after epoch ${after} (${new Date(after * 1000).toLocaleDateString()})`)

  while (true) {
    console.log(`[activities] Fetching page ${page}…`)
    const { data: batch } = await axiosInstance.get<SummaryActivity[]>('/activities', {
      params: { after, page, per_page: 200 },
    })
    all.push(...batch)
    console.log(`[activities] Page ${page}: got ${batch.length} activities (total so far: ${all.length})`)
    if (batch.length < 200) break
    page++
  }

  // Newest first
  all.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

  activitiesCache.set(all)
  console.log(`[activities] ✓ Fetched and cached ${all.length} activities (newest: ${all[0]?.name})`)
  return all
}

const SIX_HOURS = 6 * 60 * 60 * 1000

export function useActivities() {
  const cached = activitiesCache.get()

  if (cached) {
    const ageMin = Math.round((Date.now() - cached.ts) / 60_000)
    console.log(`[activities] Cache hit — ${cached.data.length} activities, ${ageMin}min old`)
  } else {
    console.log('[activities] No cache — will fetch from API')
  }

  return useQuery({
    queryKey: ['activities', 'all'],
    queryFn: fetchAllActivities,
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.ts ?? 0,
    staleTime: SIX_HOURS,
  })
}
