// PWA helpers — service worker registration + install-prompt plumbing.

// Chrome/Edge fire a `beforeinstallprompt` event we can stash and replay later.
// Safari (iOS) has no equivalent — we detect iOS and show manual instructions.
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  if (import.meta.env.DEV) return // Don't register in dev — Vite's HMR conflicts with SW caching.
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed', err)
    })
  })
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  // iOS exposes a non-standard `standalone` flag on navigator
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return (
    iosStandalone ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches
  )
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // iPadOS 13+ reports as Mac in UA but has touch support
  const isIPad = /Mac/.test(ua) && 'ontouchend' in document
  return /iPad|iPhone|iPod/.test(ua) || isIPad
}
