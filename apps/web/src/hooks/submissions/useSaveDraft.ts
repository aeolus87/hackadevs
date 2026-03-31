import { useCallback, useState } from 'react'
import { unwrapSuccessData } from '@/lib/api-unwrap'
import { axiosInstance } from '@/utils/axios.instance'
import { SUBMISSIONS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import type { Language, Submission } from '@/types/hackadevs-api.types'

export type SaveDraftPayload = {
  challengeId: string
  code: string
  language: Language
  rationaleApproach: string
  rationaleTradeoffs: string
  rationaleScale: string
  selfTags: string[]
  selfDifficultyRating: number
}

export function useSaveDraft() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (payload: SaveDraftPayload) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.post(SUBMISSIONS.CREATE(), payload)
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
