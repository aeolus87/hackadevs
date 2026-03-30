import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { CHALLENGES } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { normalizePaginated } from '@/utils/normalize-paginated'
import type { Paginated, Submission } from '@/types/hackadevs-api.types'

export function useChallengeLeaderboard(slug: string, page = 1) {
  const [data, setData] = useState<Paginated<Submission> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!slug) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get(CHALLENGES.LEADERBOARD(slug), { params: { page } })
      setData(normalizePaginated<Submission>(res.data, page))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [slug, page])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
