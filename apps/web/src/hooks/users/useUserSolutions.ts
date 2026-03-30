import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { USERS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { normalizePaginated } from '@/utils/normalize-paginated'
import type { Category, Paginated, Submission } from '@/types/hackadevs-api.types'

export function useUserSolutions(
  username: string,
  params?: { category?: Category; page?: number },
) {
  const [data, setData] = useState<Paginated<Submission> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const page = params?.page ?? 1
  const category = params?.category

  const refetch = useCallback(async () => {
    if (!username) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get(USERS.SOLUTIONS(username), {
        params: { page, category },
      })
      setData(normalizePaginated<Submission>(res.data, page))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [username, page, category])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
