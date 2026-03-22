import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { exchangeCode } from '@/auth/stravaOAuth'
import { tokenStore } from '@/auth/tokenStore'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function CallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const code = params.get('code')
    const error = params.get('error')

    if (error || !code) {
      navigate('/?error=access_denied')
      return
    }

    exchangeCode(code)
      .then((data) => {
        tokenStore.set({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
          athlete_id: data.athlete.id,
        })
        navigate('/dashboard')
      })
      .catch(() => navigate('/?error=exchange_failed'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-gray-400">Completing sign in…</p>
    </div>
  )
}
