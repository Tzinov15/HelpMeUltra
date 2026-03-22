import { clsx } from 'clsx'

export type PlanningTabId = 'calendar' | 'details'

interface Props {
  active: PlanningTabId
  onChange: (id: PlanningTabId) => void
}

const TABS: { id: PlanningTabId; label: string }[] = [
  { id: 'calendar', label: 'Calendar' },
  { id: 'details', label: 'Details' },
]

export function PlanningSubNav({ active, onChange }: Props) {
  return (
    <nav className="flex gap-1 border-b border-hmu-tertiary dark:border-gray-800 bg-hmu-surface dark:bg-gray-900 px-6">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'border-b-2 px-4 py-3 text-sm font-medium transition-colors',
            active === tab.id
              ? 'border-hmu-primary text-hmu-primary dark:border-orange-500 dark:text-orange-400'
              : 'border-transparent text-hmu-secondary dark:text-gray-500 hover:text-hmu-primary dark:hover:text-gray-300'
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
