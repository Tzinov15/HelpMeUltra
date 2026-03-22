import { useAthlete } from '@/features/zones/hooks/useAthlete'
import { useAuth } from '@/auth/AuthContext'
import { useTheme } from '@/lib/theme'

export function Header() {
  const { data: athlete } = useAthlete()
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-hmu-tertiary dark:border-gray-800 bg-hmu-surface dark:bg-gray-900 px-4">

      {/* Brand */}
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="HelpMeUltra"
          className="h-8 w-8 rounded object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <span className="text-base font-bold tracking-tight text-hmu-primary dark:text-white">
          HelpMeUltra
        </span>
        {athlete && (
          <span className="hidden text-sm text-hmu-secondary dark:text-gray-400 sm:block">
            {athlete.firstname} {athlete.lastname}
          </span>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Theme toggle — dark/light */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="flex h-7 w-7 items-center justify-center rounded text-hmu-secondary dark:text-gray-500 hover:text-hmu-primary dark:hover:text-gray-300 transition-colors"
        >
          {theme === 'dark' ? (
            /* Sun icon */
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="5" />
              <path strokeLinecap="round" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            /* Moon icon */
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {athlete?.profile_medium && (
          <img src={athlete.profile_medium} alt="avatar" className="h-7 w-7 rounded-full" />
        )}

        <button
          onClick={logout}
          className="text-xs text-hmu-secondary dark:text-gray-500 hover:text-hmu-primary dark:hover:text-gray-300 transition-colors"
        >
          Sign out
        </button>
      </div>

    </header>
  )
}
