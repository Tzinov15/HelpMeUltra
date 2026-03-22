import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { TabNav, type TabId } from '@/components/layout/TabNav'
import { ActivityFeed } from '@/features/activities/ActivityFeed'
import { WeeklyView } from '@/features/weekly/WeeklyView'
import { StrongestMileViz } from '@/features/strongestMile/StrongestMileViz'
import { useActivities } from '@/features/activities/hooks/useActivities'
import { useAthlete } from '@/features/zones/hooks/useAthlete'
import { StatBadge } from '@/components/ui/StatBadge'
import { useZonePreloader, type ZonePreloadState } from '@/features/zones/hooks/useZonePreloader'
import { useDetailPreloader, type DetailPreloadState } from '@/features/strongestMile/hooks/useDetailPreloader'

export function DashboardPage() {
  const [tab, setTab] = useState<TabId>('activities')
  const { data: activities } = useActivities()
  const { data: _athlete } = useAthlete()

  // Preloaders live here — above the tabs — so they survive tab switches
  // and are never torn down by ActivityFeed or StrongestMileViz remounting.
  const [zoneProgress, setZoneProgress] = useState<ZonePreloadState | null>(null)
  const [detailProgress, setDetailProgress] = useState<DetailPreloadState | null>(null)
  useZonePreloader(activities, setZoneProgress)
  useDetailPreloader(activities, setDetailProgress)

  const seasonStats = activities?.reduce(
    (acc, a) => {
      const actIsRun = ['Run', 'TrailRun'].includes(a.sport_type)
      const actIsRide = ['Ride', 'MountainBikeRide', 'GravelRide'].includes(a.sport_type)
      if (actIsRun) { acc.runMiles += a.distance / 1609.344; acc.runElev += a.total_elevation_gain }
      if (actIsRide) { acc.rideMiles += a.distance / 1609.344; acc.rideElev += a.total_elevation_gain }
      acc.total++
      return acc
    },
    { runMiles: 0, runElev: 0, rideMiles: 0, rideElev: 0, total: 0 }
  )

  return (
    <div className="flex h-screen flex-col bg-hmu-bg dark:bg-gray-950 text-hmu-primary dark:text-white overflow-hidden">
      <Header />

      {seasonStats && (
        <div className="flex items-center gap-8 border-b border-hmu-tertiary dark:border-gray-800 bg-hmu-surface-alt dark:bg-gray-900 px-6 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-hmu-secondary dark:text-gray-500">
            12mo totals
          </span>
          <StatBadge
            label="Run Miles"
            value={`${Math.round(seasonStats.runMiles).toLocaleString()}`}
            sub={`${Math.round((seasonStats.runElev * 3.28084) / 1000)}k ft`}
          />
          <StatBadge
            label="Ride Miles"
            value={`${Math.round(seasonStats.rideMiles).toLocaleString()}`}
            sub={`${Math.round((seasonStats.rideElev * 3.28084) / 1000)}k ft`}
          />
          <StatBadge label="Activities" value={`${seasonStats.total}`} />
        </div>
      )}

      <TabNav active={tab} onChange={setTab} />

      <main className="flex-1 overflow-y-auto">
        {tab === 'activities' && <ActivityFeed zoneProgress={zoneProgress} />}
        {tab === 'weekly' && <WeeklyView />}
        {tab === 'strongest' && <StrongestMileViz detailProgress={detailProgress} />}
      </main>
    </div>
  )
}
