import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChallengeCard } from '@/components/challenge-card'
import { CategoryTabBar } from '@/components/category-tab-bar'
import { InlineError } from '@/components/inline-error'
import { SkeletonCard } from '@/components/skeleton-card'
import { StreakHeatmap } from '@/components/streak-heatmap'
import { useAuthUser } from '@/contexts/auth-context'
import { useActiveChallenges } from '@/hooks/challenges/useActiveChallenges'
import { useChallenges } from '@/hooks/challenges/useChallenges'
import { useGlobalLeaderboard } from '@/hooks/leaderboard/useGlobalLeaderboard'
import { useMyRank } from '@/hooks/leaderboard/useMyRank'
import { useUnreadCount } from '@/hooks/notifications/useUnreadCount'
import { useMe } from '@/hooks/users/useMe'
import { useUserSolutions } from '@/hooks/users/useUserSolutions'
import { apiChallengeToUi } from '@/utils/map-api-challenge'
import type { Challenge as UiChallenge } from '@/types/hackadevs'
import type { Category } from '@/types/hackadevs-api.types'

const filters = ['This week', 'Trending', 'My tags', 'Beginner'] as const

const weekTheme = {
  title: 'Cold start',
  body: 'Warmup challenges are live first — grab an easy one, then level up.',
}

export default function FeedPage() {
  const { data: myRank } = useMyRank()
  const { user, isAuthenticated } = useAuthUser()
  useMe()
  useUnreadCount()
  const [filter, setFilter] = useState<(typeof filters)[number]>('This week')

  const { data: mySolutions } = useUserSolutions(user?.username ?? '', { page: 1 })

  const myCategories = useMemo(() => {
    const s = new Set<Category>()
    for (const sub of mySolutions?.data ?? []) {
      if (sub.challenge?.category) s.add(sub.challenge.category)
    }
    return [...s]
  }, [mySolutions])

  const listParams = useMemo(() => {
    const base = { page: 1, limit: 50 as const }
    if (filter === 'Beginner')
      return { ...base, difficulty: 'BEGINNER' as const, status: 'ACTIVE' as const }
    if (filter === 'This week' || filter === 'Trending' || filter === 'My tags')
      return { ...base, status: 'ACTIVE' as const }
    return { ...base, status: 'ACTIVE' as const }
  }, [filter])

  const {
    data: listData,
    loading: listLoading,
    error: listError,
    refetch: refetchList,
  } = useChallenges(listParams)
  const { data: activeList, loading: activeLoading } = useActiveChallenges()
  const { data: topWeekBoard, loading: topWeekLoading } = useGlobalLeaderboard({
    page: 1,
    limit: 25,
    enabled: true,
  })

  const cards: UiChallenge[] = useMemo(() => {
    if (!listData?.data?.length) return []
    let rows = listData.data
    if (filter === 'Trending') {
      rows = [...rows].sort((a, b) => b.submissionCount - a.submissionCount)
    }
    if (filter === 'My tags') {
      if (!isAuthenticated || myCategories.length === 0) rows = []
      else rows = rows.filter((c) => myCategories.includes(c.category))
    }
    return rows.map((c) => apiChallengeToUi(c))
  }, [listData, filter, myCategories, isAuthenticated])

  const weekChallenges = useMemo(() => {
    if (!activeList?.length) return []
    return activeList.slice(0, 3).map((c) => apiChallengeToUi(c))
  }, [activeList])

  const topByWeekly = useMemo(() => {
    const rows = topWeekBoard?.data ?? []
    return [...rows].sort((a, b) => b.weeklyRepDelta - a.weeklyRepDelta).slice(0, 5)
  }, [topWeekBoard])

  const heatmapDays = useMemo(() => {
    const n = user?.currentStreakDays ?? 0
    const len = 20
    const on = Math.min(n, len)
    return Array.from({ length: len }, (_, i) => i >= len - on)
  }, [user?.currentStreakDays])

  return (
    <div
      className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-start"
      data-testid="feed-root"
    >
      <div className="min-w-0 flex-1 lg:max-w-[65%]">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-hd-text">Home</h1>
          <p className="mt-1 text-sm text-hd-secondary">
            Streak, weekly rep, and curated discovery — not the full catalog by category.
          </p>
        </div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-hd-muted">
          Discovery
        </p>
        <CategoryTabBar
          tabs={[...filters]}
          value={filter}
          onChange={(v) => setFilter(v as (typeof filters)[number])}
        />
        {listError && (
          <div className="mt-6">
            <InlineError
              message={`Could not load challenges. ${listError}`}
              onRetry={() => void refetchList()}
            />
          </div>
        )}
        <div className="mt-6 space-y-4">
          {listLoading &&
            [0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-[12px] bg-[rgba(255,255,255,0.04)] p-4">
                <SkeletonCard />
              </div>
            ))}
          {!listLoading && !listError && cards.length === 0 && (
            <p className="text-sm text-hd-muted">No challenges match this filter.</p>
          )}
          {cards.map((c) => (
            <ChallengeCard key={c.slug} challenge={c} />
          ))}
        </div>
      </div>
      <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-24 lg:w-[35%] lg:max-w-md lg:self-start">
        <div className="rounded-[12px] border border-hd-indigo/20 bg-hd-indigo-surface p-5">
          <p className="font-mono text-[11px] uppercase tracking-wide text-hd-indigo-tint">
            This week&apos;s theme
          </p>
          <h3 className="mt-2 text-base font-medium text-hd-text">{weekTheme.title}</h3>
          <p className="mt-2 text-sm text-hd-secondary">{weekTheme.body}</p>
        </div>
        <div className="rounded-[12px] border border-hd-border bg-hd-card p-5">
          <div className="mb-3 flex items-center gap-2 text-hd-amber">
            <svg className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M8 1c0 2-1.5 3-2 5a2 2 0 104 0c-.5-2-2-3-2-5zm-3.5 9c-.8 0-1.5.7-1.5 1.5V14h9v-2.5c0-.8-.7-1.5-1.5-1.5h-6z" />
            </svg>
            <span className="text-sm font-medium">
              {myRank?.weeklyDelta != null ? `${myRank.weeklyDelta} weekly rep` : 'Your streak'}
            </span>
          </div>
          <StreakHeatmap days={heatmapDays} />
        </div>
        <div className="rounded-[12px] border border-hd-border bg-hd-card p-5">
          <h3 className="mb-3 text-sm font-medium text-hd-text">Active challenges</h3>
          {activeLoading && <SkeletonCard />}
          {!activeLoading && weekChallenges.length === 0 && (
            <p className="text-sm text-hd-muted">No active challenges from the API yet.</p>
          )}
          <ul className="space-y-3">
            {weekChallenges.map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/challenge/${c.slug}`}
                  className="text-sm font-medium text-hd-indigo-tint hover:text-hd-indigo-hover"
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[12px] border border-hd-border bg-hd-card p-5">
          <h3 className="mb-3 text-sm font-medium text-hd-text">Top solvers this week</h3>
          {topWeekLoading && <SkeletonCard />}
          {!topWeekLoading && topByWeekly.length === 0 && (
            <p className="text-sm text-hd-muted">No weekly rep data yet.</p>
          )}
          <ul className="space-y-3">
            {topByWeekly.map((e) => (
              <li key={e.userId} className="flex items-center gap-3">
                <img
                  src={
                    e.avatarUrl ??
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(e.username)}`
                  }
                  alt=""
                  className="h-8 w-8 rounded-full"
                  width={32}
                  height={32}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-hd-text">{e.displayName}</p>
                  <p className="font-mono text-[11px] text-hd-emerald">
                    +{e.weeklyRepDelta} rep this week
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
