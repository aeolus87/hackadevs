import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { SUBMISSIONS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import type { Submission } from '@/types/hackadevs-api.types'

export function useSubmission(submissionId: string) {
  const [data, setData] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!submissionId) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get<Submission>(SUBMISSIONS.GET(submissionId))
      setData(res.data)
    } catch (e) {
      const { message, status } = parseAxiosError(e)
      setError(message)
      if (status === 404) setData(null)
    } finally {
      setLoading(false)
    }
  }, [submissionId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
