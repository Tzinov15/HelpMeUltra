/**
 * Preloads DetailedActivity (with best_efforts) for all run/trail-run activities.
 *
 * dep is `activities?.length` — NOT the array reference.
 *
 * Rationale: TanStack Query returns a new array reference on every background
 * refetch even when data is identical. If we used the array reference as a dep,
 * the effect would re-run (and start a new batch) every time TanStack silently
 * revalidates activities. Using `.length` means we only restart when activities
 * are genuinely added or removed.
 *
 * We also do NOT set a cancel ref or return a cleanup that stops in-flight
 * fetches. Letting fetches complete ensures localStorage is always fully written.
 * `mountedRef` gates UI callbacks only, so we never call setState after unmount.
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
  onProgress?: OnProgress,
  enabled = false
) {
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const activityCount = activities?.length ?? 0

  useEffect(() => {
    if (!enabled || !activityCount || !activities) return

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

    const total = eligible.length
    let loaded = 0

    async function run() {
      for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
        const batch = eligible.slice(i, i + BATCH_SIZE)

        await Promise.all(
          batch.map(async (a) => {
            try {
              const { data } = await axiosInstance.get<DetailedActivity>(
                `/activities/${a.id}`,
                { params: { include_all_efforts: true } }
              )
              detailCache.set(a.id, data)
            } catch (err) {
              const status = (err as { response?: { status: number } }).response?.status
              console.warn(`[detail-preloader] ✗ detail for ${a.id} — HTTP ${status ?? 'network error'}`)
            } finally {
              loaded++
              if (mountedRef.current) {
                onProgress?.({ total, loaded, done: loaded >= total })
              }
            }
          })
        )

        if (i + BATCH_SIZE < eligible.length) {
          await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
        }
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityCount, enabled])
}
