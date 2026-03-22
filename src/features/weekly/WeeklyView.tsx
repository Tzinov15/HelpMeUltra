import { WeeklyMileageChart } from './WeeklyMileageChart'
import { WeeklyZoneDistribution } from './WeeklyZoneDistribution'

export function WeeklyView() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <WeeklyMileageChart />
      <div className="border-t border-hmu-tertiary dark:border-gray-800 pt-8">
        <WeeklyZoneDistribution />
      </div>
    </div>
  )
}
