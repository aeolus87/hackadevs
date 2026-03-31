import { useMemo } from 'react'
import { useActiveChallenges } from '@/hooks/challenges/useActiveChallenges'

export function useSubmitSolutionHref() {
  const { data, loading } = useActiveChallenges()
  const first = data?.[0]
  const slug = first?.slug
  const title = first?.title ?? null

  return useMemo(() => {
    if (slug) {
      return {
        href: `/challenge/${slug}/submit` as const,
        loading,
        hasActive: true as const,
        challengeTitle: title,
      }
    }
    return {
      href: '/challenges' as const,
      loading,
      hasActive: false as const,
      challengeTitle: null as string | null,
    }
  }, [slug, title, loading])
}
