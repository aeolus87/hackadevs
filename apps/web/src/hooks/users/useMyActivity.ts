import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { USERS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { normalizePaginated } from '@/utils/normalize-paginated'
import type { ActivityEvent, Paginated } from '@/types/hackadevs-api.types'

export function useMyActivity(page = 1) {
  const [data, setData] = useState<Paginated<ActivityEvent> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get(USERS.ME_ACTIVITY(), { params: { page } })
      setData(normalizePaginated<ActivityEvent>(res.data, page))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
