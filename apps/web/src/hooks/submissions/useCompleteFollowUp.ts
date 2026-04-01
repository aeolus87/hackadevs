import { useCallback, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { SUBMISSIONS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { unwrapSuccessData } from '@/lib/api-unwrap'
import type { Submission } from '@/types/hackadevs-api.types'

export type FollowUpAnswer = { id: string; text: string }

export function useCompleteFollowUp() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (submissionId: string, answers: FollowUpAnswer[]) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.post<unknown>(SUBMISSIONS.FOLLOW_UP(submissionId), {
        answers,
      })
      return unwrapSuccessData<Submission>(res.data)
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
