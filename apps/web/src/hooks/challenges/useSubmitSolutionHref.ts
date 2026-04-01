import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useActiveChallenges } from '@/hooks/challenges/useActiveChallenges'

export function useSubmitSolutionHref() {
  const { pathname } = useLocation()
  const { data, loading } = useActiveChallenges()

  return useMemo(() => {
    const m = pathname.match(/^\/challenge\/([^/]+)/)
    const routeSlug = m?.[1] ?? null
    const titleFromActive =
      routeSlug && data ? (data.find((c) => c.slug === routeSlug)?.title ?? null) : null

    if (routeSlug) {
      return {
        href: `/challenge/${routeSlug}/submit` as const,
        loading,
        hasActive: true as const,
        challengeTitle: titleFromActive,
      }
    }

    return {
      href: '/feed' as const,
      loading,
      hasActive: false as const,
      challengeTitle: null as string | null,
    }
  }, [pathname, data, loading])
}
