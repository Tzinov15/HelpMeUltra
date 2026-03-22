import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { TopLevelNav } from '@/components/layout/TopLevelNav'
import { useActivities } from '@/features/activities/hooks/useActivities'
import { useAthlete } from '@/features/zones/hooks/useAthlete'
import { useZonePreloader, type ZonePreloadState } from '@/features/zones/hooks/useZonePreloader'
import { useDetailPreloader, type DetailPreloadState } from '@/features/strongestMile/hooks/useDetailPreloader'
import { activitiesCache, zonesCache, detailCache } from '@/lib/stravaCache'
import type { SummaryActivity } from '@/features/activities/hooks/useActivities'

// Shared context passed to child routes via <Outlet context={...}>
export interface DashboardContext {
  activities: SummaryActivity[] | undefined
  zoneProgress: ZonePreloadState | null
  detailProgress: DetailPreloadState | null
}

export function DashboardPage() {
  const [syncEnabled, setSyncEnabled] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const queryClient = useQueryClient()
  const { data: activities, refetch: refetchActivities } = useActivities()
  const { data: _athlete } = useAthlete()

  // Preloaders are opt-in — only fire after the user clicks Sync
  const [zoneProgress, setZoneProgress] = useState<ZonePreloadState | null>(null)
  const [detailProgress, setDetailProgress] = useState<DetailPreloadState | null>(null)
  useZonePreloader(activities, setZoneProgress, syncEnabled)
  useDetailPreloader(activities, setDetailProgress, syncEnabled)

  const handleSync = useCallback(async () => {
    setSyncing(true)
    setSyncEnabled(false)
    activitiesCache.clear()
    zonesCache.clearAll()
    detailCache.clearAll()
    queryClient.removeQueries({ queryKey: ['activities', 'all'] })
    try {
      await refetchActivities()
    } finally {
      setSyncEnabled(true)
      setSyncing(false)
    }
  }, [refetchActivities, queryClient])

  const outletContext: DashboardContext = { activities, zoneProgress, detailProgress }

  return (
    <div className="flex h-screen flex-col bg-hmu-bg dark:bg-gray-950 text-hmu-primary dark:text-white overflow-hidden">
      <Header
        onSync={handleSync}
        syncing={syncing}
        lastSyncedAt={activitiesCache.cachedAt()}
      />
      <TopLevelNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Outlet context={outletContext} />
      </div>
    </div>
  )
}
