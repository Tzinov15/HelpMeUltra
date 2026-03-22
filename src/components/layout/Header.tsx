import { useAthlete } from '@/features/zones/hooks/useAthlete'
import { useAuth } from '@/auth/AuthContext'

export function Header() {
  const { data: athlete } = useAthlete()
  const { logout } = useAuth()

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-orange-500">⚡ Strava Viz</span>
        {athlete && (
          <span className="text-sm text-gray-300">
            {athlete.firstname} {athlete.lastname}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {athlete?.profile_medium && (
          <img src={athlete.profile_medium} alt="avatar" className="h-8 w-8 rounded-full" />
        )}
        <button
          onClick={logout}
          className="rounded text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
