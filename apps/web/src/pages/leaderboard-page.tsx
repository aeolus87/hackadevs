import { useMemo, useState } from 'react'
import { CategoryTabBar } from '@/components/category-tab-bar'
import { InlineError } from '@/components/inline-error'
import { LeaderboardTable } from '@/components/leaderboard-table'
import { PodiumRow } from '@/components/podium-row'
import { UserHoverCard } from '@/components/user-hover-card'
import { useFriendsLeaderboard } from '@/hooks/leaderboard/useFriendsLeaderboard'
import { useCategoryLeaderboard } from '@/hooks/leaderboard/useCategoryLeaderboard'
import { useGlobalLeaderboard } from '@/hooks/leaderboard/useGlobalLeaderboard'
import { useAuthUser } from '@/contexts/auth-context'
import { useMyRank } from '@/hooks/leaderboard/useMyRank'
import { useUnreadCount } from '@/hooks/notifications/useUnreadCount'
import { buildLeaderboard, categorySpotlight } from '@/data/mock'
import { apiLeaderboardEntryToRow } from '@/utils/map-leaderboard-entry'
import { uiTabLabelToApiCategory } from '@/utils/map-api-category'
import type { LeaderboardRow } from '@/types/hackadevs'

const categories = [
  'All',
  'Backend',
  'Frontend',
  'System Design',
  'Security',
  'Data Engineering',
  'ML Ops',
  'DevOps',
] as const

const scopes = ['Global', 'By category', 'Friends'] as const

function podiumTuple(
  rows: LeaderboardRow[],
): [LeaderboardRow, LeaderboardRow, LeaderboardRow] | null {
  if (rows.length < 3) return null
  const [a, b, c] = rows
  return [b, a, c]
}

export default function LeaderboardPage() {
  const { user: me } = useAuthUser()
  useMyRank()
  useUnreadCount()
  const [cat, setCat] = useState<string>('All')
  const [scope, setScope] = useState<(typeof scopes)[number]>('Global')
  const [page, setPage] = useState(1)

  const apiCat = cat !== 'All' ? uiTabLabelToApiCategory(cat) : undefined
  const showGlobal = scope === 'Global' || (scope === 'By category' && cat === 'All')
  const showCat = scope === 'By category' && cat !== 'All' && apiCat != null
  const showFriends = scope === 'Friends'

  const globalQ = useGlobalLeaderboard({ page, limit: 50, enabled: showGlobal })
  const catQ = useCategoryLeaderboard(apiCat ?? 'BACKEND', {
    page,
    limit: 50,
    enabled: showCat,
  })
  const friendsQ = useFriendsLeaderboard({ enabled: showFriends })

  const { rows, loading, error, refetch, source } = useMemo(() => {
    if (showFriends) {
      const list = friendsQ.data?.map(apiLeaderboardEntryToRow) ?? []
      return {
        rows: list,
        loading: friendsQ.loading,
        error: friendsQ.error,
        refetch: friendsQ.refetch,
        source: 'friends' as const,
      }
    }
    if (showCat && apiCat) {
      const list = catQ.data?.data.map(apiLeaderboardEntryToRow) ?? []
      return {
        rows: list,
        loading: catQ.loading,
        error: catQ.error,
        refetch: catQ.refetch,
        source: 'cat' as const,
      }
    }
    const list = globalQ.data?.data.map(apiLeaderboardEntryToRow) ?? []
    return {
      rows: list,
      loading: globalQ.loading,
      error: globalQ.error,
      refetch: globalQ.refetch,
      source: 'global' as const,
    }
  }, [
    showFriends,
    showCat,
    apiCat,
    friendsQ.data,
    friendsQ.loading,
    friendsQ.error,
    friendsQ.refetch,
    catQ.data,
    catQ.loading,
    catQ.error,
    catQ.refetch,
    globalQ.data,
    globalQ.loading,
    globalQ.error,
    globalQ.refetch,
  ])

  const mockBoard = buildLeaderboard()
  const displayRows = rows.length > 0 ? rows : !loading && !error ? mockBoard : []
  const top3 = displayRows.slice(0, 3)
  const podium = podiumTuple(top3)
  const rest = displayRows.slice(3)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-medium text-hd-text">Global leaderboard</h1>
            <p className="mt-1 font-mono text-xs text-hd-muted">Mar 24 — Mar 31, 2026</p>
          </div>
          <div className="flex gap-1 rounded-full border border-hd-border bg-hd-surface p-1">
            {scopes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setScope(s)
                  setPage(1)
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                  scope === s ? 'bg-hd-indigo text-white' : 'text-hd-muted hover:text-hd-secondary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <CategoryTabBar tabs={[...categories]} value={cat} onChange={setCat} />
        </div>
        {error && (
          <div className="mt-6">
            <InlineError message={error} onRetry={() => void refetch()} />
          </div>
        )}
        {loading && (
          <div className="mt-8 space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[52px] animate-pulse rounded-lg bg-[rgba(255,255,255,0.04)]"
              />
            ))}
          </div>
        )}
        {podium && !loading && (
          <div className="mt-8">
            <PodiumRow rows={podium} />
          </div>
        )}
        <div className="mt-8">
          <LeaderboardTable rows={rest} startRank={4} highlightUsername={me?.username ?? null} />
        </div>
        {source === 'global' && globalQ.data?.hasMore && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-hd-border bg-hd-card px-6 py-2.5 text-sm font-medium text-hd-text transition-colors duration-150 ease-out hover:border-hd-border-hover"
            >
              Load more
            </button>
          </div>
        )}
        {source === 'cat' && catQ.data?.hasMore && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-hd-border bg-hd-card px-6 py-2.5 text-sm font-medium text-hd-text transition-colors duration-150 ease-out hover:border-hd-border-hover"
            >
              Load more
            </button>
          </div>
        )}
      </div>
      <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-24 lg:w-80 lg:self-start">
        <div className="rounded-[12px] border border-hd-border bg-hd-card p-5">
          <p className="font-mono text-[11px] uppercase tracking-wide text-hd-muted">
            Category spotlight
          </p>
          <p className="mt-2 text-sm font-medium text-hd-text">
            {categorySpotlight.category} is most active this week
          </p>
          <ol className="mt-4 space-y-3">
            {categorySpotlight.devs.map((d, i) => (
              <li key={d.username} className="flex items-center gap-3">
                <span className="w-4 font-mono text-xs text-hd-muted">{i + 1}</span>
                <img
                  src={d.avatar}
                  alt=""
                  className="h-8 w-8 rounded-full"
                  width={32}
                  height={32}
                />
                <UserHoverCard user={d}>
                  <span className="truncate text-sm font-medium text-hd-text">{d.displayName}</span>
                </UserHoverCard>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-[12px] border border-hd-border bg-hd-card p-5">
          <p className="font-mono text-[11px] text-hd-muted">Your rank</p>
          <p className="mt-2 font-mono text-lg text-hd-text">
            {me?.globalRank != null ? `#${me.globalRank}` : '—'}
          </p>
        </div>
      </aside>
    </div>
  )
}
