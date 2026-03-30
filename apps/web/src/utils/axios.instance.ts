import axios from 'axios'
import { BASE_URL } from './api.routes'

const AUTH_STORAGE_KEY = 'aeokit.auth'

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
