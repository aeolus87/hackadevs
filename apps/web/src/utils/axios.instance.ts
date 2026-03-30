import axios from 'axios'
import { AUTH_STORAGE_KEY } from '@/lib/auth-storage'
import { BASE_URL } from './api.routes'

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
  (err) => {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401) {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        window.location.replace('/login')
      }
      const s = err.response?.status
      if (s != null && s >= 500) {
        console.error('[api]', err.config?.method?.toUpperCase(), err.config?.url, s)
      }
    }
    return Promise.reject(err)
  },
)
