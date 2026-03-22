import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useRaces } from './hooks/useRaces'
import { RaceInputForm } from './RaceInputForm'
import { PlanningSubNav, type PlanningTabId } from './PlanningSubNav'
import { RaceCalendar } from './calendar/RaceCalendar'
import { RaceDetails } from './details/RaceDetails'
import type { RaceInput } from '@/services/types/race'
import type { DashboardContext } from '@/pages/DashboardPage'

export function PlanningPage() {
  const { activities } = useOutletContext<DashboardContext>()
  const { races, mainRace, loading, addRace, makeMain } = useRaces()
  const [tab, setTab] = useState<PlanningTabId>('calendar')
  const [showForm, setShowForm] = useState(false)

  if (loading) return null

  // ── No race yet, or user triggered the "add" form ─────────────────────────
  if (!mainRace || showForm) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto">
        <RaceInputForm
          onSave={async (input: RaceInput) => {
            await addRace(input)
            setShowForm(false)
          }}
          onCancel={mainRace ? () => setShowForm(false) : undefined}
        />
      </div>
    )
  }

  // ── Main race set — operational view ──────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col overflow-hidden">

      {/* Race context bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-hmu-tertiary dark:border-gray-800 bg-hmu-surface-alt dark:bg-gray-900 px-6 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hmu-secondary dark:text-gray-500">
            Goal Race
          </span>
          {races.length === 1 ? (
            <span className="font-semibold text-sm text-hmu-primary dark:text-orange-400 truncate">
              {mainRace.name}
            </span>
          ) : (
            <select
              value={mainRace.id}
              onChange={(e) => makeMain(e.target.value)}
              className="rounded-lg border border-hmu-tertiary dark:border-gray-700 bg-transparent px-2 py-0.5 text-sm font-semibold text-hmu-primary dark:text-orange-400 outline-none cursor-pointer"
            >
              {races.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}{r.isMain ? ' ★' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="shrink-0 text-xs text-hmu-secondary dark:text-gray-500 hover:text-hmu-primary dark:hover:text-gray-300 transition-colors"
        >
          + Add Race
        </button>
      </div>

      {/* Sub-tabs */}
      <PlanningSubNav active={tab} onChange={setTab} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'calendar' && <RaceCalendar race={mainRace} />}
        {tab === 'details' && <RaceDetails race={mainRace} activities={activities} />}
      </div>
    </div>
  )
}
