import axios from 'axios'
import { AUTH_STORAGE_KEY, readAuthState, writeAuthState } from '@/lib/auth-storage'
import type { AuthTokenResponse } from '@/types/hackadevs-api.types'
import { sessionUserFromAuthResponse } from '@/utils/session-user'
import { AUTH, BASE_URL } from './api.routes'
import { loginPath } from '@/utils/login-path'

function getTokenFromStore(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } }
    return parsed.state?.token ?? null
  } catch {
    return null
  }
}

async function tryRefreshSession(): Promise<boolean> {
  const { refreshToken } = readAuthState()
  if (!refreshToken) return false
  try {
    const res = await axios.post<AuthTokenResponse>(
      `${BASE_URL}${AUTH.REFRESH()}`,
      { refreshToken },
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } },
    )
    const access = res.data.accessToken ?? res.data.token
    if (!access) return false
    const nextRt = res.data.refreshToken ?? null
    const prev = readAuthState()
    const u = res.data.user ? sessionUserFromAuthResponse(res.data.user) : prev.user
    if (!u) return false
    writeAuthState({ token: access, user: u, refreshToken: nextRt })
    return true
  } catch {
    return false
  }
}

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

axiosInstance.interceptors.request.use((config) => {
  const token = getTokenFromStore()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401 && err.config) {
        const cfg = err.config as { _retry?: boolean }
        const url = String(err.config.url ?? '')
        const isRefreshCall = url.includes('/auth/refresh')
        const h = err.config.headers
        const auth =
          h && typeof h === 'object'
            ? ((h as Record<string, unknown>).Authorization ??
              (h as Record<string, unknown>).authorization)
            : undefined
        const sentBearer = typeof auth === 'string' && auth.length > 0
        if (sentBearer && !cfg._retry && !isRefreshCall) {
          cfg._retry = true
          const refreshed = await tryRefreshSession()
          if (refreshed) {
            const token = readAuthState().token
            if (token) {
              err.config.headers = err.config.headers ?? {}
              ;(err.config.headers as Record<string, unknown>).Authorization = `Bearer ${token}`
            }
            return axiosInstance.request(err.config)
          }
        }
        if (sentBearer && !isRefreshCall) {
          localStorage.removeItem(AUTH_STORAGE_KEY)
          const here = `${window.location.pathname}${window.location.search}`
          window.location.replace(loginPath(here))
        }
      }
      const s = err.response?.status
      if (s != null && s >= 500) {
        console.error('[api]', err.config?.method?.toUpperCase(), err.config?.url, s)
      }
    }
    return Promise.reject(err)
  },
)
