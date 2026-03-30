import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { axiosInstance } from '@/utils/axios.instance'
import { LEADERBOARD } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import type { Category } from '@/types/hackadevs-api.types'

export type MyRankResponse = {
  globalRank: number
  weeklyDelta: number
  categoryRanks: { category: Category; rank: number }[]
}

export function useMyRank() {
  const { token } = useAuth()
  const [data, setData] = useState<MyRankResponse | null>(null)
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
      const res = await axiosInstance.get<MyRankResponse>(LEADERBOARD.MY_RANK())
      setData(res.data)
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
