import { buildAuthUrl } from '@/auth/stravaOAuth'

export function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm text-center">

        {/* Logo + wordmark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <img
            src="/logo.png"
            alt="HelpMeUltra"
            className="h-16 w-16 rounded-xl object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">HelpMeUltra</h1>
            <p className="mt-1 text-sm text-gray-400">Visualize your training data with precision</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Connect Your Account</h2>
            <p className="text-sm text-gray-400">
              Sign in with Strava to visualize your HR zones, weekly mileage, and best mile efforts
            </p>
          </div>

          <a
            href={buildAuthUrl()}
            className="flex items-center justify-center gap-3 w-full rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-500 transition-colors shadow-lg"
          >
            {/* Strava logo mark */}
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            Connect with Strava
          </a>

          <p className="mt-4 text-xs text-gray-600">
            Requires <code className="text-gray-500">activity:read_all</code> scope
          </p>
        </div>

      </div>
    </div>
  )
}
