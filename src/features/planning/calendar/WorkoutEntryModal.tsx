import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import type { PlannedWorkout, WorkoutType, RunType } from '@/services/types/trainingPlan'

interface Props {
  date: string // YYYY-MM-DD
  existing: PlannedWorkout | null
  onSave: (workout: Omit<PlannedWorkout, 'id'>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

const TYPE_TABS: { id: WorkoutType; label: string; icon: string }[] = [
  { id: 'run',      label: 'Run',      icon: '🏃' },
  { id: 'cycling',  label: 'Cycling',  icon: '🚴' },
  { id: 'strength', label: 'Strength', icon: '💪' },
  { id: 'yoga',     label: 'Yoga',     icon: '🧘' },
  { id: 'rest',     label: 'Rest',     icon: '😴' },
]

const RUN_TYPES: { id: RunType; label: string; short: string }[] = [
  { id: 'zone1_2',   label: 'Zone 1/2',   short: 'Easy' },
  { id: 'tempo',     label: 'Tempo',      short: 'Tempo' },
  { id: 'intervals', label: 'Intervals',  short: 'Int' },
]

export function WorkoutEntryModal({ date, existing, onSave, onDelete, onClose }: Props) {
  const [type, setType]       = useState<WorkoutType>(existing?.type ?? 'run')
  const [runType, setRunType] = useState<RunType>(existing?.runType ?? 'zone1_2')
  const [miles, setMiles]     = useState(existing?.miles?.toString() ?? '')
  const [vertFt, setVertFt]   = useState(existing?.vertFt?.toString() ?? '')
  const [mins, setMins]       = useState(existing?.overrideMinutes?.toString() ?? '')
  const [notes, setNotes]     = useState(existing?.notes ?? '')
  const [saving, setSaving]   = useState(false)

  // Reset run-type fields when type changes
  useEffect(() => {
    if (type !== 'run') { setRunType('zone1_2') }
  }, [type])

  const hasDistance = type === 'run' || type === 'cycling'

  const handleSave = async () => {
    setSaving(true)
    const w: Omit<PlannedWorkout, 'id'> = {
      date,
      type,
      runType: type === 'run' ? runType : undefined,
      miles: hasDistance && miles ? parseFloat(miles) : undefined,
      vertFt: type === 'run' && vertFt ? parseFloat(vertFt) : undefined,
      overrideMinutes: mins ? parseInt(mins, 10) : undefined,
      notes: notes.trim() || undefined,
    }
    await onSave(w)
    setSaving(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!existing) return
    setSaving(true)
    await onDelete(existing.id)
    setSaving(false)
    onClose()
  }

  const dateLabel = format(parseISO(date), 'EEEE, MMMM d')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-hmu-tertiary dark:border-gray-700 bg-hmu-surface dark:bg-gray-900 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-hmu-tertiary dark:border-gray-800 px-5 py-3.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
              {existing ? 'Edit Workout' : 'Add Workout'}
            </p>
            <p className="text-sm font-semibold text-hmu-primary dark:text-white">{dateLabel}</p>
          </div>
          <button onClick={onClose} className="text-hmu-secondary dark:text-gray-500 hover:text-hmu-primary dark:hover:text-gray-300 transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Type tabs */}
          <div className="flex gap-1 rounded-xl bg-hmu-surface-alt dark:bg-gray-800 p-1">
            {TYPE_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`flex flex-1 flex-col items-center rounded-lg py-1.5 text-[10px] font-bold transition-colors ${
                  type === t.id
                    ? 'bg-hmu-surface dark:bg-gray-700 text-hmu-primary dark:text-white shadow-sm'
                    : 'text-hmu-secondary dark:text-gray-500 hover:text-hmu-primary dark:hover:text-gray-300'
                }`}
              >
                <span className="text-base leading-none">{t.icon}</span>
                <span className="mt-0.5">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Run sub-type */}
          {type === 'run' && (
            <div className="flex gap-1.5">
              {RUN_TYPES.map((rt) => (
                <button
                  key={rt.id}
                  onClick={() => setRunType(rt.id)}
                  className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition-colors ${
                    runType === rt.id
                      ? rt.id === 'zone1_2'
                        ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-600 dark:bg-sky-900/20 dark:text-sky-300'
                        : rt.id === 'tempo'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300'
                        : 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-600 dark:bg-rose-900/20 dark:text-rose-300'
                      : 'border-hmu-tertiary dark:border-gray-700 text-hmu-secondary dark:text-gray-500 hover:border-hmu-secondary'
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>
          )}

          {/* Distance fields */}
          {hasDistance && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">Miles</label>
                <input
                  type="number" min="0" step="0.1" value={miles} onChange={(e) => setMiles(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-hmu-tertiary dark:border-gray-700 bg-transparent px-3 py-2 text-sm font-medium text-hmu-primary dark:text-white placeholder:text-hmu-secondary/30 outline-none focus:border-hmu-primary dark:focus:border-orange-500 transition-colors"
                />
              </div>
              {type === 'run' && (
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">Vert (ft)</label>
                  <input
                    type="number" min="0" step="100" value={vertFt} onChange={(e) => setVertFt(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-hmu-tertiary dark:border-gray-700 bg-transparent px-3 py-2 text-sm font-medium text-hmu-primary dark:text-white placeholder:text-hmu-secondary/30 outline-none focus:border-hmu-primary dark:focus:border-orange-500 transition-colors"
                  />
                </div>
              )}
            </div>
          )}

          {/* Estimated minutes */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">
              Est. Minutes{' '}
              <span className="normal-case font-normal tracking-normal">(leave blank to auto-estimate)</span>
            </label>
            <input
              type="number" min="0" step="5" value={mins} onChange={(e) => setMins(e.target.value)}
              placeholder="auto"
              className="w-full rounded-lg border border-hmu-tertiary dark:border-gray-700 bg-transparent px-3 py-2 text-sm font-medium text-hmu-primary dark:text-white placeholder:text-hmu-secondary/30 outline-none focus:border-hmu-primary dark:focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-hmu-secondary dark:text-gray-500">Notes</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…"
              rows={2}
              className="w-full resize-none rounded-lg border border-hmu-tertiary dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-hmu-primary dark:text-white placeholder:text-hmu-secondary/30 outline-none focus:border-hmu-primary dark:focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-hmu-tertiary dark:border-gray-800 px-5 py-3.5">
          {existing ? (
            <button
              onClick={handleDelete} disabled={saving}
              className="text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-hmu-tertiary dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-hmu-secondary dark:text-gray-400 hover:text-hmu-primary dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave} disabled={saving}
              className="rounded-lg bg-hmu-primary dark:bg-orange-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-hmu-primary-dk dark:hover:bg-orange-500 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
