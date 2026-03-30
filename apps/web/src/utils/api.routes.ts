const raw = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export const BASE_URL = raw.replace(/\/$/, '')

export const SOCKET_SERVER = BASE_URL.replace(/\/api\/?$/, '')

export const HEALTH = () => '/health'
