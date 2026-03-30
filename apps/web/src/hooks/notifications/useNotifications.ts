import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { axiosInstance } from '@/utils/axios.instance'
import { NOTIFICATIONS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { normalizePaginated } from '@/utils/normalize-paginated'
import type { Notification, Paginated } from '@/types/hackadevs-api.types'

export function useNotifications(params?: { page?: number; unreadOnly?: boolean; limit?: number }) {
  const { token } = useAuth()
  const page = params?.page ?? 1
  const unreadOnly = params?.unreadOnly
  const limit = params?.limit ?? 20
  const [data, setData] = useState<Paginated<Notification> | null>(null)
  const [loading, setLoading] = useState(!!token)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!token) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get(NOTIFICATIONS.LIST(), {
        params: { page, unreadOnly, limit },
      })
      setData(normalizePaginated<Notification>(res.data, page, limit))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [token, page, unreadOnly, limit])

  useEffect(() => {
    void refetch()
  }, [refetch])

  useEffect(() => {
    if (!token) return
    const t = window.setInterval(() => {
      void refetch()
    }, 60_000)
    return () => window.clearInterval(t)
  }, [token, refetch])

  return { data, loading, error, refetch }
}
