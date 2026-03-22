import type { PaceSettings } from './types/userSettings'
import { DEFAULT_PACE_SETTINGS } from './types/userSettings'

const KEY = 'hmu:user-settings'

export function getPaceSettings(): PaceSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_PACE_SETTINGS }
    return { ...DEFAULT_PACE_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_PACE_SETTINGS }
  }
}

export function savePaceSettings(settings: PaceSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings))
}
