import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChallengeCard } from '@/components/challenge-card'
import { CategoryTabBar } from '@/components/category-tab-bar'
import { InlineError } from '@/components/inline-error'
import { SkeletonCard } from '@/components/skeleton-card'
import { StreakHeatmap } from '@/components/streak-heatmap'
import { useActiveChallenges } from '@/hooks/challenges/useActiveChallenges'
import { useChallenges } from '@/hooks/challenges/useChallenges'
import { useMyRank } from '@/hooks/leaderboard/useMyRank'
import { useUnreadCount } from '@/hooks/notifications/useUnreadCount'
import { mockTopSolversWeek, streakHeatmapDays, weekTheme } from '@/data/mock'
import { apiChallengeToUi } from '@/utils/map-api-challenge'
import type { Challenge as UiChallenge } from '@/types/hackadevs'

const filters = ['This week', 'Trending', 'My tags', 'Beginner'] as const

export default function FeedPage() {
  const { data: myRank } = useMyRank()
  useUnreadCount()
  const [filter, setFilter] = useState<(typeof filters)[number]>('This week')

  const listParams = useMemo(() => {
    if (filter === 'Beginner') return { difficulty: 'BEGINNER' as const, page: 1 }
    if (filter === 'This week') return { status: 'ACTIVE' as const, page: 1 }
    return { page: 1 }
  }, [filter])

  const {
    data: listData,
    loading: listLoading,
    error: listError,
    refetch: refetchList,
  } = useChallenges(listParams)
  const { data: activeList, loading: activeLoading } = useActiveChallenges()

  const cards: UiChallenge[] = useMemo(() => {
    if (!listData?.data?.length) return []
    return listData.data.map((c) => apiChallengeToUi(c))
  }, [listData])

  const weekChallenges = useMemo(() => {
    if (!activeList?.length) return []
    return activeList.slice(0, 3).map((c) => apiChallengeToUi(c))
  }, [activeList])

  return (
    <div
      className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-start"
      data-testid="feed-root"
    >
      <div className="min-w-0 flex-1 lg:max-w-[65%]">
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
          <StreakHeatmap days={streakHeatmapDays} />
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
          <ul className="space-y-3">
            {mockTopSolversWeek.map((s) => (
              <li key={s.user.username} className="flex items-center gap-3">
                <img
                  src={s.user.avatar}
                  alt=""
                  className="h-8 w-8 rounded-full"
                  width={32}
                  height={32}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-hd-text">{s.user.displayName}</p>
                  <p className="font-mono text-[11px] text-hd-emerald">+{s.delta} rep this week</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
