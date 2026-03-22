import { createContext, useContext } from 'react'
import type { StoredToken } from './tokenStore'

export interface AuthState {
  token: StoredToken | null
  isAuthenticated: boolean
  logout: () => void
}

export const AuthContext = createContext<AuthState>({
  token: null,
  isAuthenticated: false,
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)
