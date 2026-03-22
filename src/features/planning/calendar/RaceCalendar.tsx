import { useMemo } from 'react'
import {
  startOfWeek,
  addDays,
  differenceInCalendarWeeks,
  isSameWeek,
  isAfter,
  parseISO,
  format,
  isToday,
  differenceInDays,
} from 'date-fns'
import type { Race } from '@/services/types/race'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Props {
  race: Race
}

interface WeekEntry {
  key: string
  weekStart: Date
  weeksUntilRace: number
  days: Date[]
  isCurrentWeek: boolean
  isRaceWeek: boolean
}

export function RaceCalendar({ race }: Props) {
  const raceDate = useMemo(() => parseISO(race.date), [race.date])

  const weeks = useMemo<WeekEntry[]>(() => {
    const today = new Date()
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 })
    const raceWeekStart = startOfWeek(raceDate, { weekStartsOn: 1 })

    const result: WeekEntry[] = []
    let current = thisWeekStart

    for (let i = 0; i <= 52; i++) {
      if (isAfter(current, raceWeekStart)) break
      result.push({
        key: current.toISOString(),
        weekStart: current,
        weeksUntilRace: differenceInCalendarWeeks(raceWeekStart, current, { weekStartsOn: 1 }),
        days: Array.from({ length: 7 }, (_, d) => addDays(current, d)),
        isCurrentWeek: isSameWeek(current, today, { weekStartsOn: 1 }),
        isRaceWeek: isSameWeek(current, raceDate, { weekStartsOn: 1 }),
      })
      current = addDays(current, 7)
    }
    return result
  }, [raceDate])

  const daysUntil = differenceInDays(raceDate, new Date())
  const totalWeeks = weeks.length > 0 ? weeks[0].weeksUntilRace : 0

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-hmu-primary dark:text-white">{race.name}</h2>
          <p className="mt-0.5 text-sm text-hmu-secondary dark:text-gray-400">
            {format(raceDate, 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-hmu-primary dark:text-white leading-none">
            {daysUntil > 0 ? daysUntil : 0}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
            days out
          </div>
          <div className="mt-1 text-xs text-hmu-secondary dark:text-gray-500">
            {totalWeeks} week{totalWeeks !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Day column headers */}
      <div className="mb-1 grid grid-cols-[88px_1fr] gap-3">
        <div />
        <div className="grid grid-cols-7 gap-1">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-bold uppercase tracking-widest text-hmu-secondary dark:text-gray-600"
            >
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* Week rows */}
      <div className="space-y-1">
        {weeks.map((week) => (
          <div
            key={week.key}
            className={`grid grid-cols-[88px_1fr] gap-3 rounded-lg px-2 py-1.5 transition-colors ${
              week.isCurrentWeek
                ? 'bg-hmu-accent/15 dark:bg-orange-400/8 ring-1 ring-hmu-accent/60 dark:ring-orange-400/30'
                : week.isRaceWeek
                ? 'bg-hmu-primary/8 dark:bg-orange-600/8 ring-1 ring-hmu-primary/30 dark:ring-orange-500/30'
                : ''
            }`}
          >
            {/* Week label */}
            <div className="flex flex-col justify-center min-w-0">
              {week.isRaceWeek ? (
                <span className="text-[10px] font-black uppercase tracking-widest text-hmu-primary dark:text-orange-400">
                  Race Week
                </span>
              ) : (
                <>
                  <span className="text-xs font-semibold text-hmu-primary dark:text-white">
                    {week.weeksUntilRace === 0 ? 'This Week' : `${week.weeksUntilRace}w out`}
                  </span>
                  <span className="text-[10px] text-hmu-secondary dark:text-gray-500">
                    {format(week.weekStart, 'MMM d')}
                  </span>
                </>
              )}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {week.days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const isRaceDay = dateStr === race.date
                const todayFlag = isToday(day)

                return (
                  <div
                    key={dateStr}
                    className={`relative flex h-9 flex-col items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      isRaceDay
                        ? 'bg-hmu-primary dark:bg-orange-500 text-white font-bold shadow-sm'
                        : todayFlag
                        ? 'bg-hmu-accent dark:bg-orange-400/20 text-hmu-primary dark:text-orange-400 font-bold ring-1 ring-hmu-accent dark:ring-orange-400/40'
                        : 'text-hmu-secondary dark:text-gray-500'
                    }`}
                  >
                    <span>{format(day, 'd')}</span>
                    {isRaceDay && (
                      <span className="absolute -top-1.5 -right-1 text-[10px] leading-none">🏁</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {daysUntil <= 0 && (
        <p className="mt-6 text-center text-sm text-hmu-secondary dark:text-gray-500">
          Race day has passed. Time to reflect on what we've built.
        </p>
      )}
    </div>
  )
}
