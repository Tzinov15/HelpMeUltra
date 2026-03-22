/**
 * Theme system.
 *
 * Uses Tailwind's `darkMode: 'class'` strategy. The `dark` class is applied
 * to <html> so all `dark:` variants in components work automatically.
 *
 * To add light-mode styles to a component, prefix them with `dark:`:
 *   className="bg-white dark:bg-gray-900"
 *
 * Future work: fill in the light-mode palette and flip the defaults.
 * For now, dark is the only fully-styled mode.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'hmu:theme'

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* ignore */ }
  return 'dark'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
  console.log(`[theme] Applied theme: ${theme}`)
}

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  // Apply on first render before paint
  useEffect(() => { applyTheme(theme) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
