import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { CHALLENGES } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import type { Challenge } from '@/types/hackadevs-api.types'
import { unwrapSuccessData } from '@/lib/api-unwrap'

function extractList(raw: unknown): Challenge[] {
  if (Array.isArray(raw)) return raw as Challenge[]
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    const items = o.items ?? o.data
    if (Array.isArray(items)) return items as Challenge[]
  }
  return []
}

export function useActiveChallenges() {
  const [data, setData] = useState<Challenge[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get<unknown>(CHALLENGES.ACTIVE())
      setData(extractList(unwrapSuccessData(res.data)))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
