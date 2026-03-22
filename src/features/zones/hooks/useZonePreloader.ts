/**
 * Preloads HR zone data for all activities in the background.
 *
 * Strategy:
 *  - Skip any activity already in localStorage (zonesCache)
 *  - Skip activities without heart rate data (has_heartrate = false)
 *  - Fetch in batches of 3 with a 600ms pause between batches (~5 req/sec max)
 *    to stay well clear of Strava's 200 req/15min rate limit
 *  - Each fetched result is written to both localStorage AND React Query's cache,
 *    so useActivityZones() picks it up instantly without a second request
 */

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '@/api/client'
import { zonesCache } from '@/lib/stravaCache'
import type { ActivityZone } from './useActivityZones'
import type { SummaryActivity } from '@/features/activities/hooks/useActivities'

const BATCH_SIZE = 3
const BATCH_DELAY_MS = 600

interface PreloadState {
  total: number
  loaded: number
  done: boolean
}

type OnProgress = (state: PreloadState) => void

export function useZonePreloader(
  activities: SummaryActivity[] | undefined,
  onProgress?: OnProgress
) {
  const queryClient = useQueryClient()
  const cancelRef = useRef(false)

  useEffect(() => {
    if (!activities?.length) return

    const eligible = activities.filter(
      (a) => a.has_heartrate && !zonesCache.has(a.id)
    )

    if (!eligible.length) {
      onProgress?.({ total: 0, loaded: 0, done: true })
      return
    }

    cancelRef.current = false
    const total = eligible.length
    let loaded = 0

    async function run() {
      for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
        if (cancelRef.current) break

        const batch = eligible.slice(i, i + BATCH_SIZE)

        await Promise.all(
          batch.map(async (a) => {
            try {
              const { data } = await axiosInstance.get<ActivityZone[]>(
                `/activities/${a.id}/zones`
              )
              zonesCache.set(a.id, data)
              // Populate React Query cache so useActivityZones returns data
              // without re-fetching
              queryClient.setQueryData(['activity-zones', a.id], data)
            } catch {
              // Silently skip — don't let one failure block the batch
            } finally {
              loaded++
              onProgress?.({ total, loaded, done: loaded >= total })
            }
          })
        )

        if (i + BATCH_SIZE < eligible.length) {
          await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
        }
      }
    }

    run()

    return () => {
      cancelRef.current = true
    }
  // Deliberately run only when the activity list reference changes (i.e. fresh fetch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities])
}
