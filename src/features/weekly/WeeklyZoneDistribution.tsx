import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import { useActivities } from '@/features/activities/hooks/useActivities'
import { useAthleteZones } from '@/features/zones/hooks/useAthleteZones'
import { useWeeklyStats } from './hooks/useWeeklyStats'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const ZONE_COLORS = ['#64748b', '#3b82f6', '#10b981', '#f97316', '#ef4444']
const ZONE_LABELS = ['Z1 Recovery', 'Z2 Aerobic', 'Z3 Tempo', 'Z4 Threshold', 'Z5 Max']

function classifyHR(hr: number, zones: Array<{ min: number; max: number }>): number {
  for (let i = zones.length - 1; i >= 0; i--) {
    if (hr >= zones[i].min) return i
  }
  return 0
}

export function WeeklyZoneDistribution() {
  const { data: activities, isLoading: loadingActs } = useActivities()
  const { data: athleteZones, isLoading: loadingZones } = useAthleteZones()
  const weeks = useWeeklyStats(activities)

  const chartData = useMemo(() => {
    if (!weeks.length || !athleteZones?.heart_rate?.zones) return null
    const zones = athleteZones.heart_rate.zones

    // Last 26 weeks
    const recentWeeks = weeks.slice(-26)

    // For each week, tally estimated zone time from each activity's avg HR
    const zoneTimeSeries: number[][] = Array.from(
      { length: 5 },
      () => new Array(recentWeeks.length).fill(0)
    )

    recentWeeks.forEach((week, wi) => {
      week.activities.forEach((a) => {
        if (!a.has_heartrate || !a.average_heartrate) return
        const zoneIdx = classifyHR(a.average_heartrate, zones)
        zoneTimeSeries[zoneIdx][wi] += a.moving_time / 60 // minutes
      })
    })

    return {
      labels: recentWeeks.map((w) => w.label),
      datasets: ZONE_LABELS.map((label, i) => ({
        label,
        data: zoneTimeSeries[i],
        backgroundColor: ZONE_COLORS[i],
        stack: 'zones',
        borderWidth: 0,
      })),
    }
  }, [weeks, athleteZones])

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#9ca3af', boxWidth: 12, font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${Math.round(ctx.parsed.y as number)}min`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: '#9ca3af', font: { size: 11 }, maxRotation: 30 },
        grid: { color: '#1f2937' },
      },
      y: {
        stacked: true,
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
          callback: (v) => `${v}m`,
        },
        grid: { color: '#374151' },
      },
    },
  }

  if (loadingActs || loadingZones)
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )

  if (!chartData)
    return (
      <p className="text-sm text-gray-500 text-center py-10">No data available</p>
    )

  return (
    <div className="w-full">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Weekly HR Zone Distribution — Last 26 Weeks
      </h3>
      <p className="mb-4 text-xs text-gray-500">
        Estimated from avg HR per activity using your Strava zone definitions.
      </p>
      <div className="h-72">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}
