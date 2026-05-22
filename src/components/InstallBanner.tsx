import { useEffect, useState } from 'react'
import { isIOS, isStandalone, type BeforeInstallPromptEvent } from '@/lib/pwa'

const DISMISSED_KEY = 'hmu:install-banner-dismissed'

export function InstallBanner() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === 'true' } catch { return false }
  })

  useEffect(() => {
    if (isStandalone()) return // already installed

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  if (dismissed) return null
  if (isStandalone()) return null

  const ios = isIOS()
  // On iOS we always show the banner (since beforeinstallprompt never fires).
  // On Chrome/Android we only show once the event has fired (= app is installable).
  if (!ios && !installEvent) return null

  function handleDismiss() {
    setDismissed(true)
    try { localStorage.setItem(DISMISSED_KEY, 'true') } catch { /* ignore */ }
  }

  async function handleInstall() {
    if (ios) {
      setShowIOSInstructions((v) => !v)
      return
    }
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') {
      handleDismiss()
    }
    setInstallEvent(null)
  }

  return (
    <div className="shrink-0 border-b border-hmu-tertiary dark:border-gray-800 bg-hmu-accent/15 dark:bg-orange-500/10">
      <div className="flex items-center gap-3 px-3 py-2 md:px-4">
        <svg className="h-5 w-5 shrink-0 text-hmu-primary dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
        </svg>
        <div className="min-w-0 flex-1 text-xs md:text-sm">
          <span className="font-semibold text-hmu-primary dark:text-orange-300">Install HelpMeUltra</span>
          <span className="ml-1.5 text-hmu-secondary dark:text-gray-400">
            <span className="hidden sm:inline">— add to your home screen for instant access.</span>
            <span className="sm:hidden">— add to home screen</span>
          </span>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-md bg-hmu-primary dark:bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
        >
          {ios ? (showIOSInstructions ? 'Hide' : 'How') : 'Install'}
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded p-1 text-hmu-secondary dark:text-gray-500 hover:text-hmu-primary dark:hover:text-gray-300 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {ios && showIOSInstructions && (
        <div className="border-t border-hmu-tertiary/50 dark:border-gray-800/60 px-3 py-2 text-[11px] md:text-xs text-hmu-secondary dark:text-gray-400 md:px-4">
          In Safari: tap the <span className="font-semibold">Share</span> button{' '}
          <svg className="inline h-3.5 w-3.5 align-text-bottom" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4m0 0L8 6m4-4v13" />
          </svg>
          {' '}then choose <span className="font-semibold">"Add to Home Screen"</span>.
        </div>
      )}
    </div>
  )
}
