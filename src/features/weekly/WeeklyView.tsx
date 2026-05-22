import { useState } from 'react'
import { clsx } from 'clsx'
import { useActivities } from '@/features/activities/hooks/useActivities'
import { useWeeklyChartData } from './hooks/useWeeklyChartData'
import { WeeklyMileageVertChart } from './WeeklyMileageVertChart'
import { WeeklyZoneLineChart } from './WeeklyZoneLineChart'
import { WeeklyZoneDistribution } from './WeeklyZoneDistribution'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function WeeklyView() {
  const { data: activities, isLoading } = useActivities()
  const chartData = useWeeklyChartData(activities)
  const [split, setSplit] = useState(false)

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

  const toggleBtn = (active: boolean) =>
    clsx(
      'rounded px-2.5 py-1 text-[11px] font-medium transition-colors',
      active
        ? 'bg-hmu-primary dark:bg-orange-500 text-white'
        : 'text-hmu-secondary dark:text-gray-500 hover:text-hmu-primary dark:hover:text-gray-300'
    )

  return (
    <div className="flex flex-col gap-8 md:gap-10 p-3 md:p-6">

      <div>
        <div className="mb-3 md:mb-4 flex items-center justify-between gap-3">
          <h3 className="text-[11px] md:text-xs font-semibold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
            <span className="hidden sm:inline">Weekly Mileage & Vertical — On Foot · Last 26 Weeks</span>
            <span className="sm:hidden">Miles & Vert · 26w</span>
          </h3>
          <div className="flex shrink-0 items-center gap-1 rounded-md border border-hmu-tertiary dark:border-gray-700 p-0.5">
            <button onClick={() => setSplit(false)} className={toggleBtn(!split)}>
              Combined
            </button>
            <button onClick={() => setSplit(true)} className={toggleBtn(split)}>
              Split
            </button>
          </div>
        </div>
        {split ? (
          <div className="flex flex-col gap-8">
            <WeeklyMileageVertChart data={chartData} mode="mileage" />
            <WeeklyMileageVertChart data={chartData} mode="vert" />
          </div>
        ) : (
          <WeeklyMileageVertChart data={chartData} mode="combined" />
        )}
      </div>

      <div className="border-t border-hmu-tertiary dark:border-gray-800 pt-6 md:pt-8">
        <h3 className="mb-3 md:mb-4 text-[11px] md:text-xs font-semibold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
          <span className="hidden sm:inline">Weekly Easy Zone Time — Z1 & Z2 · Last 26 Weeks</span>
          <span className="sm:hidden">Easy Zones · Z1 & Z2 · 26w</span>
        </h3>
        <WeeklyZoneLineChart
          data={chartData}
          series={[
            { zoneIndex: 0, label: 'Z1 Recovery', lineColor: '#64748b', fillColor: '#94a3b8' },
            { zoneIndex: 1, label: 'Z2 Aerobic', lineColor: '#2563eb', fillColor: '#60a5fa' },
          ]}
        />
      </div>

      <div className="border-t border-hmu-tertiary dark:border-gray-800 pt-6 md:pt-8">
        <h3 className="mb-3 md:mb-4 text-[11px] md:text-xs font-semibold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
          <span className="hidden sm:inline">Weekly Zone Time — Last 26 Weeks</span>
          <span className="sm:hidden">Weekly Zones · 26w</span>
        </h3>
        <WeeklyZoneDistribution data={chartData} />
      </div>

    </div>
  )
}
