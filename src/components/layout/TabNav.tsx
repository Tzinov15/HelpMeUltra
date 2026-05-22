import { clsx } from 'clsx'

export type TabId = 'activities' | 'weekly' | 'strongest'

const TABS: { id: TabId; label: string }[] = [
  { id: 'activities', label: 'Activities' },
  { id: 'weekly', label: 'Weekly View' },
  { id: 'strongest', label: 'Strongest Miles' },
]

interface Props {
  active: TabId
  onChange: (id: TabId) => void
}

export function TabNav({ active, onChange }: Props) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-hmu-tertiary dark:border-gray-800 bg-hmu-surface dark:bg-gray-900 px-3 md:px-6">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'shrink-0 border-b-2 px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium transition-colors',
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
