import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { axiosInstance } from '@/utils/axios.instance'
import { SUBMISSIONS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import type { Submission } from '@/types/hackadevs-api.types'

export function useMySubmission(challengeId: string) {
  const { user } = useAuth()
  const [data, setData] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!challengeId || !user?.id) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get(SUBMISSIONS.BY_CHALLENGE(challengeId), {
        params: { page: 1, limit: 100 },
      })
      const raw = res.data as { items?: Submission[]; data?: Submission[] }
      const list = raw.items ?? raw.data ?? []
      const mine = list.find((s) => s.userId === user.id) ?? null
      setData(mine ?? null)
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [challengeId, user?.id])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
