import { useCallback, useState } from 'react'
import axios from 'axios'
import { useToast } from '@/contexts/toast-context'
import { axiosInstance } from '@/utils/axios.instance'
import { SUBMISSIONS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { unwrapSuccessData } from '@/lib/api-unwrap'
import type { Submission } from '@/types/hackadevs-api.types'

export type SubmitSolutionResponse =
  | { status: 'EVALUATED'; testScore: number; message: string }
  | { status: 'AWAITING_FOLLOWUP'; followUpQuestions: { id: string; prompt: string }[] }
  | { status: 'AWAITING_VERIFICATION'; submissionId: string; questions: string[] }
  | Submission

export function useSubmitSolution() {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (submissionId: string, _challengeSlug: string) => {
      setLoading(true)
      setError(null)
      try {
        const res = await axiosInstance.post<unknown>(SUBMISSIONS.SUBMIT(submissionId))
        const data = unwrapSuccessData<SubmitSolutionResponse>(res.data)
        if (data && typeof data === 'object' && 'status' in data) {
          const st = (data as { status: string }).status
          if (st === 'AWAITING_FOLLOWUP') {
            return data as Extract<SubmitSolutionResponse, { status: 'AWAITING_FOLLOWUP' }>
          }
          if (st === 'AWAITING_VERIFICATION') {
            return data as Extract<SubmitSolutionResponse, { status: 'AWAITING_VERIFICATION' }>
          }
          if (st === 'EVALUATED') {
            const ev = data as Extract<SubmitSolutionResponse, { status: 'EVALUATED' }>
            toast.push(ev.message || 'Tests did not reach the publish threshold.', 'error')
            return ev
          }
        }
        if (data && typeof data === 'object' && 'id' in data && 'status' in data) {
          const sub = data as Submission
          if (sub.status === 'PUBLISHED') {
            return sub
          }
        }
        return data
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 409) {
          toast.push('You already submitted this challenge', 'error')
        } else {
          const { message } = parseAxiosError(e)
          setError(message)
          toast.push(message, 'error')
        }
        throw e
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  return { mutate, loading, error }
}
