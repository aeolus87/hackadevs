import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { ADMIN } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { normalizePaginated } from '@/utils/normalize-paginated'
import type { ChallengeStatus } from '@/types/hackadevs-api.types'

export type AdminChallengeRow = {
  id: string
  slug: string
  title: string
  category: string
  difficulty: string
  status: ChallengeStatus
  opensAt: string
  closesAt: string
  submissionCount: number
}

export function useAdminChallenges(params?: {
  status?: ChallengeStatus
  page?: number
  limit?: number
}) {
  const status = params?.status ?? 'DRAFT'
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const [data, setData] = useState<ReturnType<typeof normalizePaginated<AdminChallengeRow>> | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get(ADMIN.CHALLENGES(), {
        params: { status, page, limit },
      })
      setData(normalizePaginated<AdminChallengeRow>(res.data, page, limit))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [status, page, limit])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
