import { useState, useRef, useMemo } from 'react'
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
import type { PlannedWorkout, WeekGoal } from '@/services/types/trainingPlan'
import type { PaceSettings } from '@/services/types/userSettings'
import { useTrainingPlan } from '../hooks/useTrainingPlan'
import { usePaceSettings } from '../hooks/usePaceSettings'
import { WorkoutEntryModal } from './WorkoutEntryModal'

// ─── Types ────────────────────────────────────────────────────────────────────

type Layer = 'mileage' | 'zones'

interface WeekEntry {
  key: string // YYYY-MM-DD (Monday of that week)
  weekStart: Date
  weeksUntilRace: number
  days: Date[]
  isCurrentWeek: boolean
  isRaceWeek: boolean
}

interface ModalState {
  date: string
  existing: PlannedWorkout | null
}

interface WeekStats {
  miles: number
  vertFt: number
  zone1_2Min: number
  tempoMin: number
  intervalsMin: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Badge style keyed by runType (for runs) or workout type (for everything else)
const BADGE: Record<string, { bg: string; text: string; short: string }> = {
  zone1_2:   { bg: 'bg-sky-50 dark:bg-sky-950/60',       text: 'text-sky-700 dark:text-sky-300',         short: 'E'   },
  tempo:     { bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', short: 'T'   },
  intervals: { bg: 'bg-rose-50 dark:bg-rose-950/60',     text: 'text-rose-700 dark:text-rose-300',       short: 'I'   },
  cycling:   { bg: 'bg-violet-50 dark:bg-violet-950/60', text: 'text-violet-700 dark:text-violet-300',   short: 'Cyc' },
  strength:  { bg: 'bg-amber-50 dark:bg-amber-950/60',   text: 'text-amber-700 dark:text-amber-300',     short: 'Str' },
  yoga:      { bg: 'bg-teal-50 dark:bg-teal-950/60',     text: 'text-teal-700 dark:text-teal-300',       short: 'Yog' },
  rest:      { bg: 'bg-gray-100 dark:bg-gray-800',       text: 'text-gray-400 dark:text-gray-500',       short: 'Rst' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function badgeKey(w: PlannedWorkout): string {
  return w.type === 'run' && w.runType ? w.runType : w.type
}

function estimateMinutes(w: PlannedWorkout, s: PaceSettings): number {
  if (w.overrideMinutes) return w.overrideMinutes
  if (w.type === 'run' && w.miles) {
    const base =
      w.runType === 'tempo' ? s.tempoPace
      : w.runType === 'intervals' ? s.intervalsPace
      : s.zone1_2Pace
    const gapBonus =
      w.vertFt && w.miles > 0
        ? (w.vertFt / w.miles / 100) * (s.gapSecsPerHundredFtPerMile / 60)
        : 0
    return Math.round(w.miles * (base + gapBonus))
  }
  if (w.type === 'cycling' && w.miles) return Math.round(w.miles * s.cyclingPace)
  if (w.type === 'strength' || w.type === 'yoga') return 45
  return 0
}

function calcWeekStats(
  workouts: PlannedWorkout[],
  weekStart: Date,
  settings: PaceSettings
): WeekStats {
  const stats: WeekStats = { miles: 0, vertFt: 0, zone1_2Min: 0, tempoMin: 0, intervalsMin: 0 }
  const weekDates = new Set(
    Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'))
  )
  for (const w of workouts) {
    if (!weekDates.has(w.date)) continue
    if (w.miles) stats.miles += w.miles
    if (w.vertFt) stats.vertFt += w.vertFt
    const mins = estimateMinutes(w, settings)
    if (w.type === 'run') {
      if (w.runType === 'tempo') stats.tempoMin += mins
      else if (w.runType === 'intervals') stats.intervalsMin += mins
      else stats.zone1_2Min += mins
    }
  }
  return {
    ...stats,
    miles: Math.round(stats.miles * 10) / 10,
    vertFt: Math.round(stats.vertFt),
  }
}

// Shared grid template — applied to header and every week row
const GRID = '72px 8fr 2.5fr 2fr 1.5fr'

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  race: Race
  races?: Race[]    // all races (for showing other races on the calendar)
  isEditable?: boolean
}

export function RaceCalendar({ race, races = [], isEditable = true }: Props) {
  const raceDate = useMemo(() => parseISO(race.date), [race.date])

  const {
    plan,
    upsertWeekGoal,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    exportPlan,
    importPlan,
  } = useTrainingPlan(race.id)

  const { settings: pace, update: updatePace } = usePaceSettings()

  const [layer, setLayer] = useState<Layer>('mileage')
  const [modal, setModal] = useState<ModalState | null>(null)
  const [showPace, setShowPace] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  // ── Build week list ────────────────────────────────────────────────────────

  const weeks = useMemo<WeekEntry[]>(() => {
    const today = new Date()
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 })
    const raceWeekStart = startOfWeek(raceDate, { weekStartsOn: 1 })
    const result: WeekEntry[] = []
    let current = thisWeekStart
    for (let i = 0; i <= 52; i++) {
      if (isAfter(current, raceWeekStart)) break
      result.push({
        key: format(current, 'yyyy-MM-dd'),
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

  // ── Derived maps ──────────────────────────────────────────────────────────

  const workoutsByDate = useMemo(() => {
    const map: Record<string, PlannedWorkout[]> = {}
    if (!plan) return map
    for (const w of plan.workouts) {
      ;(map[w.date] ??= []).push(w)
    }
    return map
  }, [plan])

  // Other future races (not the current one) — shown as markers on the calendar
  const otherRacesByDate = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const map: Record<string, Race> = {}
    for (const r of races) {
      if (r.id !== race.id && r.date >= today) {
        map[r.date] = r
      }
    }
    return map
  }, [races, race.id])

  const schedByWeek = useMemo(() => {
    const stats: Record<string, WeekStats> = {}
    if (!plan) return stats
    for (const week of weeks) {
      stats[week.key] = calcWeekStats(plan.workouts, week.weekStart, pace)
    }
    // Also credit other races' distance into the week they fall in
    for (const [dateStr, otherRace] of Object.entries(otherRacesByDate)) {
      const weekKey = format(startOfWeek(parseISO(dateStr), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      if (stats[weekKey]) {
        stats[weekKey] = {
          ...stats[weekKey],
          miles: Math.round((stats[weekKey].miles + otherRace.totalMiles) * 10) / 10,
          vertFt: Math.round(stats[weekKey].vertFt + otherRace.totalVertFt),
        }
      }
    }
    return stats
  }, [plan, weeks, pace, otherRacesByDate])

  const daysUntil = differenceInDays(raceDate, new Date())
  const totalWeeks = weeks.length > 0 ? weeks[0].weeksUntilRace : 0

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        importPlan(ev.target?.result as string)
      } catch (err) {
        alert('Failed to import: ' + (err as Error).message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleGoalChange = (
    weekKey: string,
    field: keyof Omit<WeekGoal, 'weekKey'>,
    val: string
  ) => {
    const existing = plan?.weekGoals[weekKey] ?? { weekKey, miles: 0, vertFt: 0 }
    upsertWeekGoal({ ...existing, [field]: parseFloat(val) || 0 })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-hmu-tertiary dark:border-gray-800 px-5 py-2.5 flex items-center gap-3 flex-wrap">

        {/* Race name + countdown */}
        <div className="mr-auto min-w-0">
          <h2 className="text-sm font-bold text-hmu-primary dark:text-white leading-tight truncate">
            {race.name}
          </h2>
          <p className="text-[11px] text-hmu-secondary dark:text-gray-500">
            {format(raceDate, 'MMM d, yyyy')} ·{' '}
            {daysUntil > 0 ? `${daysUntil}d / ${totalWeeks}w out` : 'Race day has passed'}
          </p>
        </div>

        {/* Layer toggle */}
        <div className="flex rounded-lg border border-hmu-tertiary dark:border-gray-700 overflow-hidden text-[11px] font-bold">
          {(['mileage', 'zones'] as const).map((l, i) => (
            <button
              key={l}
              onClick={() => setLayer(l)}
              className={`px-3 py-1 capitalize transition-colors ${
                i > 0 ? 'border-l border-hmu-tertiary dark:border-gray-700' : ''
              } ${
                layer === l
                  ? 'bg-hmu-primary dark:bg-orange-600 text-white'
                  : 'text-hmu-secondary dark:text-gray-500 hover:text-hmu-primary dark:hover:text-gray-300'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Import / Export */}
        {isEditable && (
          <>
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <button
              onClick={() => importRef.current?.click()}
              className="text-[11px] font-medium text-hmu-secondary dark:text-gray-500 hover:text-hmu-primary dark:hover:text-gray-300 transition-colors"
            >
              Import
            </button>
            <button
              onClick={exportPlan}
              className="text-[11px] font-medium text-hmu-secondary dark:text-gray-500 hover:text-hmu-primary dark:hover:text-gray-300 transition-colors"
            >
              Export
            </button>
          </>
        )}

        {/* Pace settings gear */}
        <button
          onClick={() => setShowPace((v) => !v)}
          className={`transition-colors ${showPace ? 'text-hmu-primary dark:text-orange-400' : 'text-hmu-secondary dark:text-gray-500 hover:text-hmu-primary dark:hover:text-gray-300'}`}
          title="Pace settings"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* ── Pace settings panel ──────────────────────────────────────────────── */}
      {showPace && (
        <div className="shrink-0 border-b border-hmu-tertiary dark:border-gray-800 bg-hmu-surface-alt dark:bg-gray-900/50 px-5 py-3">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
            Pace Settings — used to auto-estimate workout duration
          </p>
          <div className="flex flex-wrap gap-4">
            {([
              { key: 'zone1_2Pace',               label: 'Zone 1/2',           unit: 'min/mi' },
              { key: 'tempoPace',                  label: 'Tempo',              unit: 'min/mi' },
              { key: 'intervalsPace',              label: 'Intervals',          unit: 'min/mi' },
              { key: 'cyclingPace',                label: 'Cycling',            unit: 'min/mi eq' },
              { key: 'gapSecsPerHundredFtPerMile', label: 'GAP bonus',          unit: 'sec/100ft/mi' },
            ] as const).map(({ key, label, unit }) => (
              <label key={key} className="flex flex-col gap-0.5 cursor-pointer">
                <span className="text-[9px] font-bold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
                  {label} <span className="font-normal normal-case tracking-normal opacity-60">({unit})</span>
                </span>
                <input
                  type="number" min="0" step="0.5"
                  value={pace[key]}
                  onChange={(e) => updatePace({ [key]: parseFloat(e.target.value) || 0 })}
                  className="w-16 rounded border border-hmu-tertiary dark:border-gray-700 bg-transparent px-2 py-1 text-xs font-medium text-hmu-primary dark:text-white outline-none focus:border-hmu-primary dark:focus:border-orange-500 transition-colors"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── Calendar ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Sticky column header row */}
        <div className="sticky top-0 z-10 bg-hmu-bg dark:bg-gray-950 border-b border-hmu-tertiary dark:border-gray-800 px-3 py-1.5">
          <div className="grid gap-x-4 px-1" style={{ gridTemplateColumns: GRID }}>
            <div />
            <div className="grid grid-cols-7 gap-0.5">
              {DAY_LABELS.map((d) => (
                <div key={d} className="text-center text-[9px] font-bold uppercase tracking-widest text-hmu-secondary dark:text-gray-600">
                  {d}
                </div>
              ))}
            </div>
            <div className="border-l border-hmu-tertiary dark:border-gray-800 pl-3 text-[9px] font-bold uppercase tracking-widest text-hmu-secondary dark:text-gray-600">
              Goal
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-hmu-secondary dark:text-gray-600">
              Sched
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-hmu-secondary dark:text-gray-600">
              Left
            </div>
          </div>
        </div>

        <div className="px-3 py-2">
        {/* Week rows */}
        <div className="space-y-0.5">
          {weeks.map((week) => {
            const goal = plan?.weekGoals[week.key]
            const sched = schedByWeek[week.key] ?? {
              miles: 0, vertFt: 0, zone1_2Min: 0, tempoMin: 0, intervalsMin: 0,
            }

            return (
              <div
                key={week.key}
                style={{ gridTemplateColumns: GRID }}
                className={`grid gap-x-4 items-start rounded-lg px-1 py-1.5 transition-colors ${
                  week.isCurrentWeek
                    ? 'bg-hmu-accent/10 dark:bg-orange-400/6 ring-1 ring-hmu-accent/40 dark:ring-orange-400/20'
                    : week.isRaceWeek
                    ? 'bg-hmu-primary/6 dark:bg-orange-600/6 ring-1 ring-hmu-primary/20 dark:ring-orange-500/20'
                    : ''
                }`}
              >
                {/* ── Week label ────────────────────────────────────────────── */}
                <div className="flex flex-col justify-start pt-1.5 min-w-0">
                  {week.isRaceWeek ? (
                    <span className="text-[10px] font-black uppercase tracking-wider text-hmu-primary dark:text-orange-400 leading-tight">
                      🏁 Race
                    </span>
                  ) : (
                    <>
                      <span className="text-[11px] font-semibold text-hmu-primary dark:text-white leading-tight truncate">
                        {week.weeksUntilRace === 0 ? 'This wk' : `${week.weeksUntilRace}w out`}
                      </span>
                      <span className="text-[9px] text-hmu-secondary dark:text-gray-500 leading-tight">
                        {format(week.weekStart, 'MMM d')}
                      </span>
                    </>
                  )}
                </div>

                {/* ── Day cells ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-7 gap-0.5">
                  {week.days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const isRaceDay = dateStr === race.date
                    const todayFlag = isToday(day)
                    const isPast = !todayFlag && day < new Date() && !isRaceDay
                    const canEdit = isEditable && !isRaceDay && !isPast
                    const dayWorkouts = workoutsByDate[dateStr] ?? []

                    return (
                      <div
                        key={dateStr}
                        className={`group relative min-h-[44px] rounded-md flex flex-col items-stretch gap-0.5 p-1 transition-colors ${
                          isRaceDay
                            ? 'bg-hmu-primary dark:bg-orange-500'
                            : isPast
                            ? 'opacity-40 cursor-default'
                            : todayFlag
                            ? 'bg-hmu-accent/20 dark:bg-orange-400/15 ring-1 ring-hmu-accent/50 dark:ring-orange-400/30'
                            : canEdit
                            ? 'hover:bg-hmu-surface-alt dark:hover:bg-gray-800/40 cursor-pointer'
                            : ''
                        }`}
                        onClick={() => {
                          if (!canEdit) return
                          setModal({ date: dateStr, existing: null })
                        }}
                      >
                        {/* Date number */}
                        <span className={`text-[10px] font-bold leading-none text-center ${
                          isRaceDay
                            ? 'text-white'
                            : todayFlag
                            ? 'text-hmu-primary dark:text-orange-400'
                            : 'text-hmu-secondary dark:text-gray-500'
                        }`}>
                          {format(day, 'd')}
                        </span>

                        {/* Workout badges */}
                        {dayWorkouts.map((w) => {
                          const bk = badgeKey(w)
                          const b = BADGE[bk] ?? BADGE['rest']
                          const hasDist = (w.type === 'run' || w.type === 'cycling') && w.miles
                          const estMins = estimateMinutes(w, pace)
                          return (
                            <button
                              key={w.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!canEdit) return
                                setModal({ date: dateStr, existing: w })
                              }}
                              className={`w-full rounded px-0.5 py-px text-[9px] font-bold leading-tight text-center ${b.bg} ${b.text} ${!isEditable ? 'cursor-default' : ''}`}
                              title={[w.notes, w.miles ? `${w.miles}mi` : null, estMins ? `~${estMins}m` : null].filter(Boolean).join(' · ')}
                            >
                              {layer === 'mileage'
                                ? hasDist ? `${w.miles}mi` : b.short
                                : estMins > 0 ? `${estMins}m` : b.short
                              }
                            </button>
                          )
                        })}

                        {/* Other race marker */}
                        {otherRacesByDate[dateStr] && (
                          <div
                            className="w-full rounded px-0.5 py-px text-[9px] font-bold leading-tight text-center bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 truncate"
                            title={otherRacesByDate[dateStr].name}
                          >
                            🏁 {otherRacesByDate[dateStr].name}
                          </div>
                        )}

                        {/* Hover "+" hint when empty and editable */}
                        {canEdit && dayWorkouts.length === 0 && !otherRacesByDate[dateStr] && (
                          <span className="absolute inset-0 flex items-center justify-center text-sm text-hmu-secondary/25 dark:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none">
                            +
                          </span>
                        )}

                        {isRaceDay && (
                          <span className="absolute -top-1 -right-0.5 text-[9px] leading-none pointer-events-none">🏁</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* ── GOAL column ───────────────────────────────────────────── */}
                <div className="border-l border-hmu-tertiary dark:border-gray-800 pl-3 flex flex-col gap-1.5 pt-0.5">
                  {layer === 'mileage' ? (
                    // Miles + vert on one line
                    <div className="flex items-end gap-2">
                      <div className="flex items-baseline gap-1">
                        <input
                          type="number" min="0" step="0.5"
                          value={goal?.miles || ''}
                          placeholder="0"
                          disabled={!isEditable}
                          onChange={(e) => handleGoalChange(week.key, 'miles', e.target.value)}
                          className={`w-10 bg-transparent px-0 py-0 text-sm font-bold outline-none border-0 border-b transition-colors text-hmu-primary dark:text-white placeholder:opacity-20 ${
                            !isEditable ? 'border-transparent cursor-default opacity-35' : 'border-hmu-tertiary/50 dark:border-gray-700 focus:border-hmu-primary dark:focus:border-orange-500'
                          }`}
                        />
                        <span className="text-[10px] font-semibold opacity-50 text-hmu-secondary dark:text-gray-400">mi</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <input
                          type="number" min="0" step="100"
                          value={goal?.vertFt || ''}
                          placeholder="0"
                          disabled={!isEditable}
                          onChange={(e) => handleGoalChange(week.key, 'vertFt', e.target.value)}
                          className={`w-12 bg-transparent px-0 py-0 text-sm font-bold outline-none border-0 border-b transition-colors text-violet-600 dark:text-violet-400 placeholder:opacity-20 ${
                            !isEditable ? 'border-transparent cursor-default opacity-35' : 'border-hmu-tertiary/50 dark:border-gray-700 focus:border-violet-500 dark:focus:border-violet-400'
                          }`}
                        />
                        <span className="text-[10px] font-semibold opacity-50 text-violet-500 dark:text-violet-400">ft</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <GoalInput
                        value={goal?.zone1_2Minutes ?? 0}
                        step="5"
                        suffix="min"
                        disabled={!isEditable}
                        onChange={(v) => handleGoalChange(week.key, 'zone1_2Minutes', v)}
                        colorClass="text-sky-600 dark:text-sky-400"
                        label="Easy"
                      />
                      <GoalInput
                        value={goal?.tempoMinutes ?? 0}
                        step="5"
                        suffix="min"
                        disabled={!isEditable}
                        onChange={(v) => handleGoalChange(week.key, 'tempoMinutes', v)}
                        colorClass="text-emerald-600 dark:text-emerald-400"
                        label="Tempo"
                      />
                      <GoalInput
                        value={goal?.intervalMinutes ?? 0}
                        step="5"
                        suffix="min"
                        disabled={!isEditable}
                        onChange={(v) => handleGoalChange(week.key, 'intervalMinutes', v)}
                        colorClass="text-rose-600 dark:text-rose-400"
                        label="Int"
                      />
                    </>
                  )}
                </div>

                {/* ── SCHED column ──────────────────────────────────────────── */}
                <div className="flex flex-col justify-center gap-0.5 pt-0.5">
                  {layer === 'mileage' ? (
                    sched.miles > 0 || sched.vertFt > 0 ? (
                      <>
                        {sched.miles > 0 && (
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black leading-none text-hmu-primary dark:text-white">{sched.miles}</span>
                            <span className="text-xs font-bold text-hmu-secondary dark:text-gray-400">mi</span>
                          </div>
                        )}
                        {sched.vertFt > 0 && (
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black leading-none text-violet-600 dark:text-violet-400">
                              {sched.vertFt >= 1000 ? `${(sched.vertFt / 1000).toFixed(1)}k` : sched.vertFt}
                            </span>
                            <span className="text-xs font-bold text-violet-400 dark:text-violet-500">ft</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-hmu-secondary/30 dark:text-gray-700">—</span>
                    )
                  ) : (
                    sched.zone1_2Min === 0 && sched.tempoMin === 0 && sched.intervalsMin === 0 ? (
                      <span className="text-sm text-hmu-secondary/30 dark:text-gray-700">—</span>
                    ) : (
                      <>
                        {sched.zone1_2Min > 0 && (
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black leading-none text-sky-600 dark:text-sky-400">{sched.zone1_2Min}</span>
                            <span className="text-[10px] font-bold text-sky-500">m E</span>
                          </div>
                        )}
                        {sched.tempoMin > 0 && (
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black leading-none text-emerald-600 dark:text-emerald-400">{sched.tempoMin}</span>
                            <span className="text-[10px] font-bold text-emerald-500">m T</span>
                          </div>
                        )}
                        {sched.intervalsMin > 0 && (
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black leading-none text-rose-600 dark:text-rose-400">{sched.intervalsMin}</span>
                            <span className="text-[10px] font-bold text-rose-500">m I</span>
                          </div>
                        )}
                      </>
                    )
                  )}
                </div>

                {/* ── LEFT column ───────────────────────────────────────────── */}
                {(() => {
                  const hasGoal = goal && (goal.miles > 0 || goal.vertFt > 0 || goal.zone1_2Minutes || goal.tempoMinutes || goal.intervalMinutes)
                  if (!hasGoal) return <div className="text-sm text-hmu-secondary/30 dark:text-gray-700">—</div>

                  if (layer === 'mileage') {
                    const leftMi = Math.round(((goal?.miles ?? 0) - sched.miles) * 10) / 10
                    const leftFt = Math.round((goal?.vertFt ?? 0) - sched.vertFt)
                    const miColor = leftMi < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-hmu-primary dark:text-white'
                    const ftColor = leftFt < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-violet-600 dark:text-violet-400'
                    return (
                      <div className="flex flex-col gap-0.5 pt-0.5">
                        {(goal?.miles ?? 0) > 0 && (
                          <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-black leading-none ${miColor}`}>{leftMi}</span>
                            <span className="text-xs font-bold text-hmu-secondary dark:text-gray-400">mi</span>
                          </div>
                        )}
                        {(goal?.vertFt ?? 0) > 0 && (
                          <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-black leading-none ${ftColor}`}>
                              {leftFt >= 1000 || leftFt <= -1000 ? `${(leftFt / 1000).toFixed(1)}k` : leftFt}
                            </span>
                            <span className="text-xs font-bold text-violet-400 dark:text-violet-500">ft</span>
                          </div>
                        )}
                      </div>
                    )
                  }

                  const leftE = (goal?.zone1_2Minutes ?? 0) - sched.zone1_2Min
                  const leftT = (goal?.tempoMinutes ?? 0) - sched.tempoMin
                  const leftI = (goal?.intervalMinutes ?? 0) - sched.intervalsMin
                  return (
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      {(goal?.zone1_2Minutes ?? 0) > 0 && (
                        <div className="flex items-baseline gap-1">
                          <span className={`text-xl font-black leading-none ${leftE < 0 ? 'text-rose-500' : 'text-sky-600 dark:text-sky-400'}`}>{leftE}</span>
                          <span className="text-[10px] font-bold text-sky-500">m E</span>
                        </div>
                      )}
                      {(goal?.tempoMinutes ?? 0) > 0 && (
                        <div className="flex items-baseline gap-1">
                          <span className={`text-xl font-black leading-none ${leftT < 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{leftT}</span>
                          <span className="text-[10px] font-bold text-emerald-500">m T</span>
                        </div>
                      )}
                      {(goal?.intervalMinutes ?? 0) > 0 && (
                        <div className="flex items-baseline gap-1">
                          <span className={`text-xl font-black leading-none ${leftI < 0 ? 'text-rose-500' : 'text-rose-600 dark:text-rose-400'}`}>{leftI}</span>
                          <span className="text-[10px] font-bold text-rose-500">m I</span>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>

        {daysUntil <= 0 && (
          <p className="mt-6 text-center text-sm text-hmu-secondary dark:text-gray-500">
            Race day has passed. Time to reflect on what we've built.
          </p>
        )}
        </div>
      </div>

      {/* ── Workout entry modal ──────────────────────────────────────────────── */}
      {modal && (
        <WorkoutEntryModal
          date={modal.date}
          existing={modal.existing}
          onSave={async (w) => {
            if (modal.existing) {
              await updateWorkout(modal.existing.id, w)
            } else {
              await addWorkout(w)
            }
          }}
          onDelete={deleteWorkout}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

// ─── GoalInput ────────────────────────────────────────────────────────────────

interface GoalInputProps {
  value: number
  step: string
  suffix: string
  disabled: boolean
  onChange: (val: string) => void
  colorClass?: string
  label?: string
}

function GoalInput({ value, step, suffix, disabled, onChange, colorClass, label }: GoalInputProps) {
  const color = colorClass ?? 'text-hmu-secondary dark:text-gray-400'
  return (
    <div className="flex flex-col gap-0.5 group/gi">
      {label && (
        <span className={`text-[9px] font-bold uppercase tracking-wide opacity-50 ${color}`}>{label}</span>
      )}
      <div className={`flex items-baseline gap-1.5 ${color}`}>
        <input
          type="number"
          min="0"
          step={step}
          value={value || ''}
          placeholder="0"
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full min-w-0 bg-transparent px-0 py-0 text-sm font-bold outline-none border-0 border-b transition-colors placeholder:opacity-20 ${color} ${
            disabled
              ? 'border-transparent cursor-default opacity-35'
              : 'border-hmu-tertiary/50 dark:border-gray-700 focus:border-hmu-primary dark:focus:border-orange-500'
          }`}
        />
        <span className={`text-[10px] shrink-0 font-semibold opacity-50 ${color}`}>{suffix}</span>
      </div>
    </div>
  )
}
