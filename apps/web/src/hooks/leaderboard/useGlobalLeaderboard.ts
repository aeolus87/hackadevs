import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { LEADERBOARD } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { normalizePaginated } from '@/utils/normalize-paginated'
import type { LeaderboardEntry, Paginated } from '@/types/hackadevs-api.types'

export function useGlobalLeaderboard(params?: {
  page?: number
  limit?: number
  enabled?: boolean
}) {
  const enabled = params?.enabled ?? true
  const page = params?.page ?? 1
  const limit = params?.limit
  const [data, setData] = useState<Paginated<LeaderboardEntry> | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get(LEADERBOARD.GLOBAL(), { params: { page, limit } })
      setData(normalizePaginated<LeaderboardEntry>(res.data, page, limit ?? 20))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [enabled, page, limit])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
