import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '@/contexts/toast-context'
import { axiosInstance } from '@/utils/axios.instance'
import { SUBMISSIONS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'

export function useSubmitSolution() {
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (submissionId: string, challengeSlug: string) => {
      setLoading(true)
      setError(null)
      try {
        await axiosInstance.post(SUBMISSIONS.SUBMIT(submissionId))
        toast.push('Solution submitted!', 'success')
        navigate(`/challenge/${challengeSlug}/solutions/${submissionId}`)
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
    [navigate, toast],
  )

  return { mutate, loading, error }
}
