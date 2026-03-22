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
    <nav className="flex gap-1 border-b border-gray-800 bg-gray-900 px-6">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'border-b-2 px-4 py-3 text-sm font-medium transition-colors',
            active === tab.id
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
