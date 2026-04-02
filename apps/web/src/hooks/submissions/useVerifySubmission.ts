import { useCallback, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { SUBMISSIONS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { unwrapSuccessData } from '@/lib/api-unwrap'

export type VerifySubmissionResult =
  | { verified: true; repAwarded?: number }
  | {
      verified: false
      unavailable?: boolean
      canRetry?: boolean
      message?: string
    }

export function useVerifySubmission() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (submissionId: string, answers: [string, string]) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.post<unknown>(SUBMISSIONS.VERIFY(submissionId), {
        answers,
      })
      return unwrapSuccessData<VerifySubmissionResult>(res.data)
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
