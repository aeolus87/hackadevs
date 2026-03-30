import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  clearAuthStorage,
  readAuthState,
  writeAuthState,
  type AuthPersistedState,
} from '@/lib/auth-storage'
import type { DevUser } from '@/types/hackadevs-api.types'

type AuthContextValue = AuthPersistedState & {
  setSession: (token: string, user: DevUser) => void
  setUser: (user: DevUser | null) => void
  setToken: (token: string | null) => void
  clearSession: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => readAuthState().token)
  const [user, setUserState] = useState<DevUser | null>(() => readAuthState().user)

  const persist = useCallback((next: AuthPersistedState) => {
    setTokenState(next.token)
    setUserState(next.user)
    if (next.token || next.user) {
      writeAuthState(next)
    } else {
      clearAuthStorage()
    }
  }, [])

  const setSession = useCallback(
    (t: string, u: DevUser) => {
      persist({ token: t, user: u })
    },
    [persist],
  )

  const setUser = useCallback(
    (u: DevUser | null) => {
      persist({ token, user: u })
    },
    [persist, token],
  )

  const setToken = useCallback(
    (t: string | null) => {
      persist({ token: t, user })
    },
    [persist, user],
  )

  const clearSession = useCallback(() => {
    persist({ token: null, user: null })
  }, [persist])

  const value = useMemo(
    () => ({
      token,
      user,
      setSession,
      setUser,
      setToken,
      clearSession,
    }),
    [token, user, setSession, setUser, setToken, clearSession],
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
