import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { TabNav, type TabId } from '@/components/layout/TabNav'
import { ActivityFeed } from '@/features/activities/ActivityFeed'
import { WeeklyView } from '@/features/weekly/WeeklyView'
import { StrongestMileViz } from '@/features/strongestMile/StrongestMileViz'
import { StatBadge } from '@/components/ui/StatBadge'
import type { DashboardContext } from '@/pages/DashboardPage'
import { zonesCache, detailCache } from '@/lib/stravaCache'
import type { SummaryActivity } from '@/features/activities/hooks/useActivities'

function exportStravaData(activities: SummaryActivity[] | undefined) {
  if (!activities?.length) return

  const zones: Record<number, unknown> = {}
  const details: Record<number, unknown> = {}

  for (const activity of activities) {
    const zoneData = zonesCache.get(activity.id)
    if (zoneData) zones[activity.id] = zoneData

    const detailData = detailCache.get(activity.id)
    if (detailData) details[activity.id] = detailData
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    activityCount: activities.length,
    zonesLoadedCount: Object.keys(zones).length,
    detailsLoadedCount: Object.keys(details).length,
    activities,
    zones,
    details,
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `strava-export-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

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
          <div className="ml-auto">
            <button
              onClick={() => exportStravaData(activities)}
              title="Download all activity data as JSON to upload to Claude"
              className="flex items-center gap-1.5 rounded-lg border border-hmu-tertiary dark:border-gray-700 px-2.5 py-1 text-xs font-medium text-hmu-secondary dark:text-gray-400 hover:text-hmu-primary dark:hover:text-gray-200 hover:border-hmu-secondary dark:hover:border-gray-500 transition-colors"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Strava Data
            </button>
          </div>
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
