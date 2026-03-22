import { useState, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext, type AuthState } from './AuthContext'
import { tokenStore, type StoredToken } from './tokenStore'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<StoredToken | null>(() => tokenStore.get())
  const navigate = useNavigate()

  const logout = useCallback(() => {
    tokenStore.clear()
    setToken(null)
    navigate('/')
  }, [navigate])

  const value: AuthState = {
    token,
    isAuthenticated: !!token,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
