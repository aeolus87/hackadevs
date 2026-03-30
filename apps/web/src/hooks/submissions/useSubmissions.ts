import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { SUBMISSIONS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { normalizePaginated } from '@/utils/normalize-paginated'
import type { Paginated, Submission } from '@/types/hackadevs-api.types'

export function useSubmissions(
  challengeId: string,
  params?: { page?: number; sortBy?: 'compositeScore' | 'createdAt' },
) {
  const page = params?.page ?? 1
  const sortBy = params?.sortBy
  const [data, setData] = useState<Paginated<Submission> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!challengeId) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get(SUBMISSIONS.BY_CHALLENGE(challengeId), {
        params: { page, sortBy },
      })
      setData(normalizePaginated<Submission>(res.data, page))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [challengeId, page, sortBy])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
