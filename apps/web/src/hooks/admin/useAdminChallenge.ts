import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { ADMIN } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { unwrapSuccessData } from '@/lib/api-unwrap'

export type AdminChallengeDetail = {
  id: string
  slug: string
  title: string
  problemStatement: string
  constraints: string[]
  bonusObjective: string | null
  tags: string[]
  category: string
  difficulty: string
  weekTheme: string
  status: string
  opensAt: string
  closesAt: string
  companySource: string | null
  companyAttributionOptIn: boolean
  submissionCount: number
  testSuite: { input: string; expectedOutput: string; isVisible: boolean }[]
}

export function useAdminChallenge(id: string | null) {
  const [data, setData] = useState<AdminChallengeDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!id) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get<unknown>(ADMIN.CHALLENGE(id))
      setData(unwrapSuccessData<AdminChallengeDetail>(res.data))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
