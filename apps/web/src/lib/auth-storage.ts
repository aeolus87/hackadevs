import type { DevUser } from '@/types/hackadevs-api.types'

export const AUTH_STORAGE_KEY = 'hackadevs.auth'

export type AuthPersistedState = {
  token: string | null
  user: DevUser | null
}

type PersistedWrapper = { state: AuthPersistedState }

export function readAuthState(): AuthPersistedState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return { token: null, user: null }
    const parsed = JSON.parse(raw) as PersistedWrapper | AuthPersistedState
    if ('state' in parsed && parsed.state) {
      return {
        token: parsed.state.token ?? null,
        user: parsed.state.user ?? null,
      }
    }
    return { token: null, user: null }
  } catch {
    return { token: null, user: null }
  }
}

export function writeAuthState(next: AuthPersistedState): void {
  const wrapped: PersistedWrapper = { state: next }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(wrapped))
}

export function clearAuthStorage(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}
