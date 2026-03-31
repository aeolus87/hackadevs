import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { axiosInstance } from '@/utils/axios.instance'
import { LEADERBOARD } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import type { LeaderboardEntry } from '@/types/hackadevs-api.types'
import { unwrapSuccessData } from '@/lib/api-unwrap'

function extractEntries(raw: unknown): LeaderboardEntry[] {
  if (Array.isArray(raw)) return raw as LeaderboardEntry[]
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    const items = o.items ?? o.data
    if (Array.isArray(items)) return items as LeaderboardEntry[]
  }
  return []
}

export function useFriendsLeaderboard(opts?: { enabled?: boolean }) {
  const enabled = opts?.enabled ?? true
  const { token } = useAuth()
  const [data, setData] = useState<LeaderboardEntry[] | null>(null)
  const [loading, setLoading] = useState(!!token && enabled)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!enabled || !token) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get<unknown>(LEADERBOARD.FRIENDS())
      setData(extractEntries(unwrapSuccessData(res.data)))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [enabled, token])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
