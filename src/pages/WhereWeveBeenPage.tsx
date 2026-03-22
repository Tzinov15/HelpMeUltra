import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { TabNav, type TabId } from '@/components/layout/TabNav'
import { ActivityFeed } from '@/features/activities/ActivityFeed'
import { WeeklyView } from '@/features/weekly/WeeklyView'
import { StrongestMileViz } from '@/features/strongestMile/StrongestMileViz'
import { StatBadge } from '@/components/ui/StatBadge'
import type { DashboardContext } from '@/pages/DashboardPage'

export function WhereWeveBeenPage() {
  const [tab, setTab] = useState<TabId>('activities')
  const { activities, zoneProgress, detailProgress } = useOutletContext<DashboardContext>()

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
    <>
      {seasonStats && (
        <div className="flex shrink-0 items-center gap-8 border-b border-hmu-tertiary dark:border-gray-800 bg-hmu-surface-alt dark:bg-gray-900 px-6 py-3">
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
    </>
  )
}
