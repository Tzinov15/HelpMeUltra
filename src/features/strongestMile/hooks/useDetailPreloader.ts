/**
 * Preloads DetailedActivity (with best_efforts) for all run/trail-run activities.
 *
 * Same batching strategy as useZonePreloader — writes to both localStorage
 * and React Query cache so downstream consumers get data without extra fetches.
 */

import { useEffect, useRef } from 'react'
import { axiosInstance } from '@/api/client'
import { detailCache } from '@/lib/stravaCache'
import type { SummaryActivity } from '@/features/activities/hooks/useActivities'
import type { DetailedActivity } from '@/features/activities/hooks/useActivityDetail'

const BATCH_SIZE = 3
const BATCH_DELAY_MS = 700

export interface DetailPreloadState {
  total: number
  loaded: number
  done: boolean
}

type OnProgress = (state: DetailPreloadState) => void

export function useDetailPreloader(
  activities: SummaryActivity[] | undefined,
  onProgress?: OnProgress
) {
  const cancelRef = useRef(false)

  useEffect(() => {
    if (!activities?.length) return

    const eligible = activities.filter(
      (a) =>
        ['Run', 'TrailRun'].includes(a.sport_type) &&
        a.distance > 1609.344 &&
        !detailCache.has(a.id)
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
              const { data } = await axiosInstance.get<DetailedActivity>(
                `/activities/${a.id}`,
                { params: { include_all_efforts: true } }
              )
              detailCache.set(a.id, data)
            } catch {
              // Skip silently
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities])
}
