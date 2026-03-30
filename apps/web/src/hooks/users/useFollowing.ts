import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { USERS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { normalizePaginated } from '@/utils/normalize-paginated'
import type { DevUser, Paginated } from '@/types/hackadevs-api.types'

export function useFollowing(username: string, page = 1) {
  const [data, setData] = useState<Paginated<DevUser> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!username) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get(USERS.FOLLOWING(username), { params: { page } })
      setData(normalizePaginated<DevUser>(res.data, page))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [username, page])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
