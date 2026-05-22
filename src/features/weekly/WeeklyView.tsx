import { useActivities } from '@/features/activities/hooks/useActivities'
import { useWeeklyChartData } from './hooks/useWeeklyChartData'
import { WeeklyMileageVertChart } from './WeeklyMileageVertChart'
import { WeeklyZoneLineChart } from './WeeklyZoneLineChart'
import { WeeklyZoneDistribution } from './WeeklyZoneDistribution'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function WeeklyView() {
  const { data: activities, isLoading } = useActivities()
  const chartData = useWeeklyChartData(activities)

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )

  if (!chartData.length)
    return (
      <p className="py-10 text-center text-sm text-hmu-secondary dark:text-gray-500">
        No activity data available
      </p>
    )

  return (
    <div className="flex flex-col gap-10 p-6">

      <div>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
          Weekly Mileage & Vertical — On Foot · Last 26 Weeks
        </h3>
        <WeeklyMileageVertChart data={chartData} />
      </div>

      <div className="border-t border-hmu-tertiary dark:border-gray-800 pt-8">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
          Weekly Easy Zone Time — Z1 & Z2 · Last 26 Weeks
        </h3>
        <WeeklyZoneLineChart
          data={chartData}
          series={[
            { zoneIndex: 0, label: 'Z1 Recovery', lineColor: '#64748b', fillColor: '#94a3b8' },
            { zoneIndex: 1, label: 'Z2 Aerobic', lineColor: '#2563eb', fillColor: '#60a5fa' },
          ]}
        />
      </div>

      <div className="border-t border-hmu-tertiary dark:border-gray-800 pt-8">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
          Weekly Zone Time — Last 26 Weeks
        </h3>
        <WeeklyZoneDistribution data={chartData} />
      </div>

    </div>
  )
}
