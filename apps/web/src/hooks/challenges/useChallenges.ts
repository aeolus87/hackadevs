import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { CHALLENGES } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { normalizePaginated } from '@/utils/normalize-paginated'
import type { Category, Challenge, Difficulty, Paginated } from '@/types/hackadevs-api.types'

export function useChallenges(params?: {
  status?: string
  category?: Category
  difficulty?: Difficulty
  tag?: string
  page?: number
}) {
  const page = params?.page ?? 1
  const [data, setData] = useState<Paginated<Challenge> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get(CHALLENGES.LIST(), {
        params: {
          page,
          status: params?.status,
          category: params?.category,
          difficulty: params?.difficulty,
          tag: params?.tag,
        },
      })
      setData(normalizePaginated<Challenge>(res.data, page))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, params?.status, params?.category, params?.difficulty, params?.tag])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
