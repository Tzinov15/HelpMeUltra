/**
 * Preloads HR zone data for all activities in the background.
 *
 * dep is `activities?.length` — NOT the array reference — to avoid cancelling
 * in-flight fetches when TanStack Query returns a new reference on background
 * refetch. See implementation notes in useDetailPreloader for full rationale.
 */

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '@/api/client'
import { zonesCache } from '@/lib/stravaCache'
import type { ActivityZone } from './useActivityZones'
import type { SummaryActivity } from '@/features/activities/hooks/useActivities'

const BATCH_SIZE = 3
const BATCH_DELAY_MS = 600

export interface ZonePreloadState {
  total: number
  loaded: number
  done: boolean
}

type OnProgress = (state: ZonePreloadState) => void

export function useZonePreloader(
  activities: SummaryActivity[] | undefined,
  onProgress?: OnProgress
) {
  const queryClient = useQueryClient()
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const activityCount = activities?.length ?? 0

  useEffect(() => {
    if (!activityCount || !activities) return

    const eligible = activities.filter(
      (a) => a.has_heartrate && !zonesCache.has(a.id)
    )

    console.log(
      `[zone-preloader] ${activities.filter(a => a.has_heartrate).length} HR activities total,` +
      ` ${eligible.length} need zone fetch, ${activityCount - eligible.length} already cached`
    )

    if (!eligible.length) {
      console.log('[zone-preloader] All zones cached ✓')
      onProgress?.({ total: 0, loaded: 0, done: true })
      return
    }

    const total = eligible.length
    let loaded = 0

    async function run() {
      console.log(`[zone-preloader] Starting batch load of ${total} zone sets (batch size ${BATCH_SIZE})`)

      for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
        const batch = eligible.slice(i, i + BATCH_SIZE)
        const batchNum = Math.floor(i / BATCH_SIZE) + 1

        console.log(`[zone-preloader] Batch ${batchNum}: fetching activity IDs [${batch.map(a => a.id).join(', ')}]`)

        await Promise.all(
          batch.map(async (a) => {
            try {
              const { data } = await axiosInstance.get<ActivityZone[]>(
                `/activities/${a.id}/zones`
              )
              zonesCache.set(a.id, data)
              queryClient.setQueryData(['activity-zones', a.id], data)
              console.log(`[zone-preloader] ✓ Stored zones for "${a.name}" (${a.id})`)
            } catch (err) {
              const status = (err as { response?: { status: number } }).response?.status
              console.warn(`[zone-preloader] ✗ Failed to fetch zones for ${a.id} — HTTP ${status ?? 'network error'}`)
            } finally {
              loaded++
              if (mountedRef.current) {
                onProgress?.({ total, loaded, done: loaded >= total })
              }
            }
          })
        )

        if (i + BATCH_SIZE < eligible.length) {
          console.log(`[zone-preloader] Batch ${batchNum} done (${loaded}/${total}), waiting ${BATCH_DELAY_MS}ms…`)
          await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
        }
      }

      console.log(`[zone-preloader] ✓ Complete — ${loaded}/${total} zone sets loaded`)
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityCount])
}
