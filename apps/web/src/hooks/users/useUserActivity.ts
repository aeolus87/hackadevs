import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { USERS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import type { ActivityEvent, Paginated } from '@/types/hackadevs-api.types'
import { normalizePaginated } from '@/utils/normalize-paginated'

export function useUserActivity(username: string, limit = 30) {
  const [data, setData] = useState<Paginated<ActivityEvent> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!username) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get<unknown>(USERS.PROFILE_ACTIVITY(username), {
        params: { page: 1, limit },
      })
      setData(normalizePaginated<ActivityEvent>(res.data, 1, limit))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [username, limit])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
