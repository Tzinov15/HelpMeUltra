import { useActivities } from '@/features/activities/hooks/useActivities'
import { useWeeklyChartData } from './hooks/useWeeklyChartData'
import { WeeklyMileageChart } from './WeeklyMileageChart'
import { WeeklyVertChart } from './WeeklyVertChart'
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
          Weekly Mileage — On Foot · Last 26 Weeks
        </h3>
        <WeeklyMileageChart data={chartData} />
      </div>

      <div className="border-t border-hmu-tertiary dark:border-gray-800 pt-8">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
          Weekly Vertical — On Foot · Last 26 Weeks
        </h3>
        <WeeklyVertChart data={chartData} />
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
