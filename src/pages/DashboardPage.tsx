import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { TabNav, type TabId } from '@/components/layout/TabNav'
import { ActivityFeed } from '@/features/activities/ActivityFeed'
import { WeeklyView } from '@/features/weekly/WeeklyView'
import { StrongestMileViz } from '@/features/strongestMile/StrongestMileViz'
import { useActivities } from '@/features/activities/hooks/useActivities'
import { useAthlete } from '@/features/zones/hooks/useAthlete'
import { StatBadge } from '@/components/ui/StatBadge'

export function DashboardPage() {
  const [tab, setTab] = useState<TabId>('activities')
  const { data: activities } = useActivities()
  const { data: _athlete } = useAthlete()

  // Quick season totals banner
  const seasonStats = activities?.reduce(
    (acc, a) => {
      const runTypes = ['Run', 'TrailRun']
      const rideTypes = ['Ride', 'MountainBikeRide', 'GravelRide']
      const actIsRun = runTypes.includes(a.sport_type)
      const actIsRide = rideTypes.includes(a.sport_type)
      if (actIsRun) {
        acc.runMiles += a.distance / 1609.344
        acc.runElev += a.total_elevation_gain
      }
      if (actIsRide) {
        acc.rideMiles += a.distance / 1609.344
        acc.rideElev += a.total_elevation_gain
      }
      acc.total++
      return acc
    },
    { runMiles: 0, runElev: 0, rideMiles: 0, rideElev: 0, total: 0 }
  )

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white overflow-hidden">
      <Header />

      {/* Season stats banner */}
      {seasonStats && (
        <div className="flex items-center gap-8 border-b border-gray-800 bg-gray-900 px-6 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
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
        {tab === 'activities' && <ActivityFeed />}
        {tab === 'weekly' && <WeeklyView />}
        {tab === 'strongest' && <StrongestMileViz />}
      </main>
    </div>
  )
}
