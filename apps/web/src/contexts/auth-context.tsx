import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  clearAuthStorage,
  readAuthState,
  writeAuthState,
  type AuthPersistedState,
} from '@/lib/auth-storage'
import type { DevUser } from '@/types/hackadevs-api.types'

type AuthContextValue = AuthPersistedState & {
  setSession: (token: string, user: DevUser, refreshToken: string | null) => void
  setUser: (user: DevUser | null) => void
  setToken: (token: string | null) => void
  clearSession: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = readAuthState()
  const [token, setTokenState] = useState<string | null>(() => initial.token)
  const [user, setUserState] = useState<DevUser | null>(() => initial.user)
  const [refreshToken, setRefreshTokenState] = useState<string | null>(() => initial.refreshToken)

  const persist = useCallback((next: AuthPersistedState) => {
    setTokenState(next.token)
    setUserState(next.user)
    setRefreshTokenState(next.refreshToken)
    if (next.token || next.refreshToken || next.user) {
      writeAuthState(next)
    } else {
      clearAuthStorage()
    }
  }, [])

  const setSession = useCallback(
    (t: string, u: DevUser, r: string | null) => {
      persist({ token: t, user: u, refreshToken: r })
    },
    [persist],
  )

  const setUser = useCallback(
    (u: DevUser | null) => {
      persist({ token, user: u, refreshToken })
    },
    [persist, token, refreshToken],
  )

  const setToken = useCallback(
    (t: string | null) => {
      persist({ token: t, user, refreshToken })
    },
    [persist, user, refreshToken],
  )

  const clearSession = useCallback(() => {
    persist({ token: null, user: null, refreshToken: null })
  }, [persist])

  const value = useMemo(
    () => ({
      token,
      user,
      refreshToken,
      setSession,
      setUser,
      setToken,
      clearSession,
    }),
    [token, user, refreshToken, setSession, setUser, setToken, clearSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth requires AuthProvider')
  return ctx
}

export function useAuthUser() {
  const { token, user } = useAuth()
  return useMemo(
    () => ({
      token,
      user,
      isAuthenticated: token != null && token.length > 0,
    }),
    [token, user],
  )
}
