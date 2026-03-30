import { useCallback, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { SUBMISSIONS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import type { TestRunResult } from '@/types/hackadevs-api.types'

export function useRunTests() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (submissionId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.post<TestRunResult>(SUBMISSIONS.RUN(submissionId))
      return res.data
    } catch (e) {
      const { message } = parseAxiosError(e)
      setError(message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  return { mutate, loading, error }
}
