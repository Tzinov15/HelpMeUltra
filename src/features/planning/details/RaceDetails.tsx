import { useMemo } from 'react'
import { parseISO, format, differenceInDays } from 'date-fns'
import type { Race } from '@/services/types/race'
import type { SummaryActivity } from '@/features/activities/hooks/useActivities'

const ON_FOOT_TYPES = ['Run', 'TrailRun', 'Walk', 'Hike', 'VirtualRun']

interface Props {
  race: Race
  activities: SummaryActivity[] | undefined
}

// ─── Delta badge ──────────────────────────────────────────────────────────────

interface DeltaRowProps {
  label: string
  raceValue: number
  baseValue: number
  unit: string
  formatVal?: (v: number) => string
}

function DeltaRow({ label, raceValue, baseValue, unit, formatVal }: DeltaRowProps) {
  const delta = raceValue - baseValue
  const positive = delta >= 0
  const fmt = formatVal ?? ((v: number) => Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 1 }))
  const fmtSigned = (v: number) => {
    const abs = Math.abs(v)
    const sign = v >= 0 ? '+' : '−'
    return `${sign}${fmt(abs)}`
  }

  return (
    <div className="flex items-center justify-between py-3.5 border-b border-hmu-tertiary/40 dark:border-gray-800 last:border-0">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-hmu-secondary dark:text-gray-500">
          {label}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-black text-hmu-primary dark:text-white">
            {fmt(raceValue)}
            <span className="ml-1 text-sm font-medium text-hmu-secondary dark:text-gray-400">{unit}</span>
          </span>
          <span className="text-xs text-hmu-secondary dark:text-gray-500">
            vs {fmt(baseValue)} {unit}
          </span>
        </div>
      </div>
      <div
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums ${
          positive
            ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
        }`}
      >
        {fmtSigned(delta)}
        <span className="text-xs font-normal ml-0.5">{unit}</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RaceDetails({ race, activities }: Props) {
  const raceDate = useMemo(() => parseISO(race.date), [race.date])
  const daysUntil = differenceInDays(raceDate, new Date())

  const longestRun = useMemo(() => {
    if (!activities) return null
    const onFoot = activities.filter((a) => ON_FOOT_TYPES.includes(a.sport_type))
    if (onFoot.length === 0) return null
    return onFoot.reduce((best, a) => (a.distance > best.distance ? a : best), onFoot[0])
  }, [activities])

  const longestMiles = longestRun ? longestRun.distance / 1609.344 : 0
  const longestVertFt = longestRun ? longestRun.total_elevation_gain * 3.28084 : 0

  const fmtElevation = (v: number) =>
    Math.abs(v) >= 1000
      ? `${(Math.abs(v) / 1000).toFixed(1)}k`
      : Math.round(Math.abs(v)).toLocaleString()

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">

      {/* Race card */}
      <div className="overflow-hidden rounded-2xl border border-hmu-tertiary dark:border-gray-800">

        {/* Header band */}
        <div className="bg-hmu-primary dark:bg-gray-800 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black leading-tight text-white">{race.name}</h2>
              <p className="mt-1 text-sm text-white/65">{format(raceDate, 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-4xl font-black leading-none text-white">
                {daysUntil > 0 ? daysUntil : '—'}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                days out
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 divide-x divide-hmu-tertiary dark:divide-gray-800 bg-hmu-surface dark:bg-gray-900">
          <div className="px-5 py-4 text-center">
            <div className="text-2xl font-black text-hmu-primary dark:text-white">
              {race.totalMiles.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
              Miles
            </div>
          </div>
          <div className="px-5 py-4 text-center">
            <div className="text-2xl font-black text-hmu-primary dark:text-white">
              {race.totalVertFt >= 1000
                ? `${(race.totalVertFt / 1000).toFixed(1)}k`
                : race.totalVertFt.toLocaleString()}
            </div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
              Vert (ft)
            </div>
          </div>
          <div className="px-5 py-4 text-center">
            <div className="text-2xl font-black text-hmu-primary dark:text-white">
              {daysUntil > 0 ? `${Math.ceil(daysUntil / 7)}` : '—'}
            </div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
              Weeks Out
            </div>
          </div>
        </div>
      </div>

      {/* Comparison card */}
      <div className="rounded-2xl border border-hmu-tertiary dark:border-gray-800 bg-hmu-surface dark:bg-gray-900 p-6">
        <div className="mb-1 flex items-baseline justify-between gap-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-hmu-secondary dark:text-gray-400">
            vs. Your Longest Run (12 mo)
          </h3>
          {longestRun && (
            <span
              className="max-w-[180px] truncate text-xs text-hmu-secondary dark:text-gray-500"
              title={longestRun.name}
            >
              {longestRun.name}
            </span>
          )}
        </div>

        {longestRun ? (
          <>
            <DeltaRow
              label="Distance"
              raceValue={race.totalMiles}
              baseValue={longestMiles}
              unit="mi"
            />
            <DeltaRow
              label="Elevation Gain"
              raceValue={race.totalVertFt}
              baseValue={longestVertFt}
              unit="ft"
              formatVal={fmtElevation}
            />
          </>
        ) : (
          <p className="mt-3 text-sm text-hmu-secondary dark:text-gray-500">
            {activities ? 'No on-foot activities found in the last 12 months.' : 'Loading activity data…'}
          </p>
        )}
      </div>
    </div>
  )
}
