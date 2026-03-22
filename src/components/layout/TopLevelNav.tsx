import { useNavigate, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'

const TABS = [
  { path: '/wherewevebeen', label: "Where We've Been" },
  { path: '/wherearewegoing', label: "Where We're Going" },
]

export function TopLevelNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="flex shrink-0 items-center border-b-2 border-hmu-tertiary dark:border-gray-700 bg-hmu-surface dark:bg-gray-950 px-4">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.path)
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={clsx(
              '-mb-0.5 border-b-2 px-5 py-3.5 text-sm font-bold tracking-wide transition-colors',
              active
                ? 'border-hmu-primary text-hmu-primary dark:border-orange-400 dark:text-orange-400'
                : 'border-transparent text-hmu-secondary dark:text-gray-500 hover:text-hmu-primary dark:hover:text-gray-200'
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
