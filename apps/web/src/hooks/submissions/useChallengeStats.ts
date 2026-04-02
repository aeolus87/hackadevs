import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { SUBMISSIONS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { unwrapSuccessData } from '@/lib/api-unwrap'

export type ChallengeSubmissionStats = {
  totalSubmissions: number
  languageDistribution: { language: string; count: number; percentage: number }[]
  avgTestScore: number
  avgRationaleScore: number
}

export function useChallengeStats(challengeId: string) {
  const [data, setData] = useState<ChallengeSubmissionStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!challengeId) return
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get<unknown>(SUBMISSIONS.STATS(challengeId))
      setData(unwrapSuccessData<ChallengeSubmissionStats>(res.data))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [challengeId])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  return { data, loading, error, refetch: fetchStats }
}
