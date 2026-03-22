import { useState, useCallback } from 'react'
import type { PaceSettings } from '@/services/types/userSettings'
import { getPaceSettings, savePaceSettings } from '@/services/userSettingsService'

export function usePaceSettings() {
  const [settings, setSettings] = useState<PaceSettings>(() => getPaceSettings())

  const update = useCallback((updates: Partial<PaceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates }
      savePaceSettings(next)
      return next
    })
  }, [])

  return { settings, update }
}
