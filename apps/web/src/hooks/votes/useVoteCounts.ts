import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { VOTES } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import type { VoteValue } from '@/types/hackadevs-api.types'
import { unwrapSuccessData } from '@/lib/api-unwrap'

export type VoteCounts = {
  upvoteCount: number
  downvoteCount: number
  userVote: VoteValue | null
}

function mapCounts(raw: unknown): VoteCounts {
  if (!raw || typeof raw !== 'object') {
    return { upvoteCount: 0, downvoteCount: 0, userVote: null }
  }
  const o = raw as Record<string, unknown>
  const up = typeof o.upvoteCount === 'number' ? o.upvoteCount : Number(o.up ?? o.upvotes ?? 0)
  const down =
    typeof o.downvoteCount === 'number' ? o.downvoteCount : Number(o.down ?? o.downvotes ?? 0)
  const uv = o.userVote as VoteValue | null | undefined
  return {
    upvoteCount: Number.isFinite(up) ? up : 0,
    downvoteCount: Number.isFinite(down) ? down : 0,
    userVote: uv === 'UP' || uv === 'DOWN' ? uv : null,
  }
}

export function useVoteCounts(
  submissionId: string,
  opts?: { refreshDep?: number; pollIntervalMs?: number; pollEnabled?: boolean },
) {
  const [data, setData] = useState<VoteCounts | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refreshDep = opts?.refreshDep ?? 0
  const pollMs = opts?.pollIntervalMs ?? 30_000
  const pollEnabled = opts?.pollEnabled ?? false

  const refetch = useCallback(async () => {
    if (!submissionId) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get<unknown>(VOTES.COUNTS(submissionId))
      setData(mapCounts(unwrapSuccessData(res.data)))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [submissionId, refreshDep])

  useEffect(() => {
    void refetch()
  }, [refetch])

  useEffect(() => {
    if (!pollEnabled || !submissionId) return
    const t = window.setInterval(() => {
      void refetch()
    }, pollMs)
    return () => window.clearInterval(t)
  }, [pollEnabled, pollMs, submissionId, refetch])

  return { data, loading, error, refetch }
}
