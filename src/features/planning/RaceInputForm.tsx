import { useState } from 'react'
import { TopoBackground } from './components/TopoBackground'
import type { RaceInput } from '@/services/types/race'

interface Props {
  onSave: (input: RaceInput) => Promise<void>
  onCancel?: () => void
}

export function RaceInputForm({ onSave, onCancel }: Props) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [miles, setMiles] = useState('')
  const [vert, setVert] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !date || !miles || !vert) {
      setError('Please fill in all required fields.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        name: name.trim(),
        date,
        totalMiles: parseFloat(miles),
        totalVertFt: parseFloat(vert),
      })
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="relative flex h-full items-center justify-center overflow-y-auto bg-hmu-bg dark:bg-gray-950 text-hmu-primary dark:text-white px-6 py-5">

      {/* Topo background */}
      <div className="absolute inset-0 text-hmu-primary dark:text-gray-400">
        <TopoBackground />
      </div>

      {/* Gradient vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-hmu-bg/75 via-hmu-bg/10 to-hmu-bg/85 dark:from-gray-950/75 dark:via-gray-950/10 dark:to-gray-950/85" />

      {/* Cancel / back */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="absolute top-4 left-6 z-20 flex items-center gap-1.5 text-xs font-medium text-hmu-secondary dark:text-gray-500 hover:text-hmu-primary dark:hover:text-gray-300 transition-colors"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">

        {/* Eyebrow pill */}
        <div className="mb-4 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-hmu-tertiary dark:border-gray-700 bg-hmu-surface/60 dark:bg-gray-900/60 px-4 py-1 text-[10px] font-bold tracking-[0.28em] uppercase text-hmu-secondary dark:text-gray-400">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21l5-9 4 4 5-8 4 12" />
            </svg>
            Your Next Finish Line
          </span>
        </div>

        {/* Headline */}
        <h1 className="mb-2 text-center font-black leading-none tracking-tight text-hmu-primary dark:text-white text-4xl sm:text-5xl">
          Where Are We Going?
        </h1>
        <p className="mb-5 text-center text-sm tracking-wide text-hmu-secondary dark:text-gray-400">
          Set the goal. Build the plan. Earn the start line.
        </p>

        {/* Form card */}
        <div className="rounded-2xl border border-hmu-tertiary dark:border-gray-800 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md shadow-2xl p-5">
          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Race name */}
            <div>
              <label className="mb-1 block text-[10px] font-bold tracking-[0.22em] uppercase text-hmu-secondary dark:text-gray-500">
                Race Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Western States 100"
                className="w-full rounded-xl border border-hmu-tertiary dark:border-gray-700 bg-transparent px-4 py-2.5 text-base font-semibold text-hmu-primary dark:text-white placeholder:text-hmu-secondary/30 dark:placeholder:text-gray-600 outline-none focus:border-hmu-primary dark:focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Date + Miles */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-[0.22em] uppercase text-hmu-secondary dark:text-gray-500">
                  Race Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-hmu-tertiary dark:border-gray-700 bg-transparent px-3 py-2.5 text-sm font-medium text-hmu-primary dark:text-white outline-none focus:border-hmu-primary dark:focus:border-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-[0.22em] uppercase text-hmu-secondary dark:text-gray-500">
                  Total Miles
                </label>
                <input
                  type="number"
                  value={miles}
                  onChange={(e) => setMiles(e.target.value)}
                  placeholder="100"
                  min="0"
                  step="0.1"
                  className="w-full rounded-xl border border-hmu-tertiary dark:border-gray-700 bg-transparent px-3 py-2.5 text-sm font-medium text-hmu-primary dark:text-white placeholder:text-hmu-secondary/30 dark:placeholder:text-gray-600 outline-none focus:border-hmu-primary dark:focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* Vert */}
            <div>
              <label className="mb-1 block text-[10px] font-bold tracking-[0.22em] uppercase text-hmu-secondary dark:text-gray-500">
                Total Elevation Gain (ft)
              </label>
              <input
                type="number"
                value={vert}
                onChange={(e) => setVert(e.target.value)}
                placeholder="18,000"
                min="0"
                step="100"
                className="w-full rounded-xl border border-hmu-tertiary dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm font-medium text-hmu-primary dark:text-white placeholder:text-hmu-secondary/30 dark:placeholder:text-gray-600 outline-none focus:border-hmu-primary dark:focus:border-orange-500 transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-hmu-primary py-3 text-sm font-bold tracking-widest uppercase text-white transition-colors hover:bg-hmu-primary-dk disabled:opacity-50 dark:bg-orange-600 dark:hover:bg-orange-500"
            >
              {saving ? 'Saving…' : 'Set the Goal →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
