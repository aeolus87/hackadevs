import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ActivityFeed } from '@/components/activity-feed'
import { DevProfileHeader } from '@/components/dev-profile-header'
import { InlineError } from '@/components/inline-error'
import { SkillBarChart } from '@/components/skill-bar-chart'
import { SkeletonCard } from '@/components/skeleton-card'
import { useAuthUser } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { useFollow } from '@/hooks/follows/useFollow'
import { useUnfollow } from '@/hooks/follows/useUnfollow'
import { useFollowers } from '@/hooks/users/useFollowers'
import { useFollowing } from '@/hooks/users/useFollowing'
import { useProfile } from '@/hooks/users/useProfile'
import { useUserActivity } from '@/hooks/users/useUserActivity'
import { useUnreadCount } from '@/hooks/notifications/useUnreadCount'
import { activityEventToUiItem } from '@/utils/map-activity-event'
import { apiDevUserToUi } from '@/utils/map-api-user'

export default function ProfilePage() {
  const { username = '' } = useParams()
  const { user: viewer, isAuthenticated } = useAuthUser()
  useUnreadCount()
  const { data, loading, error, refetch } = useProfile(username)
  const {
    data: actData,
    loading: actLoading,
    error: actError,
    refetch: refetchAct,
  } = useUserActivity(username)
  const { data: fol } = useFollowers(username)
  const { data: fing } = useFollowing(username)
  const toast = useToast()
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    if (data?.viewerFollows !== undefined) setFollowing(data.viewerFollows)
  }, [data?.viewerFollows])

  const activityItems = useMemo(
    () => (actData?.data ?? []).map((ev, i) => activityEventToUiItem(ev, i)),
    [actData],
  )

  const pinned = data?.pinnedSubmissions ?? []

  const refetchProfile = useCallback(() => void refetch(), [refetch])
  const { mutate: followMut } = useFollow(refetchProfile)
  const { mutate: unfollowMut } = useUnfollow(refetchProfile)

  const toggleFollow = async () => {
    if (!isAuthenticated) return
    try {
      if (following) {
        setFollowing(false)
        await unfollowMut(username)
      } else {
        setFollowing(true)
        await followMut(username)
      }
    } catch {
      setFollowing((f) => !f)
      toast.push('Could not update follow', 'error')
    }
  }

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (!loading && !data && error) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <InlineError message={`Could not load profile. ${error}`} onRetry={() => void refetch()} />
        <Link to="/feed" className="text-sm text-hd-indigo-tint">
          Back to home
        </Link>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg rounded-[12px] border border-hd-border border-l-4 border-l-hd-rose bg-hd-card p-6">
        <p className="text-sm text-hd-secondary">Profile not found.</p>
        <Link to="/feed" className="mt-3 inline-block text-sm font-medium text-hd-indigo-tint">
          Back to home
        </Link>
      </div>
    )
  }

  const uiUser = apiDevUserToUi(data)
  const isSelf = viewer?.username === username

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <DevProfileHeader
        user={uiUser}
        viewerUsername={viewer?.username ?? null}
        following={following}
        followBusy={false}
        signInToFollowReturn={!isSelf && !isAuthenticated ? `/u/${username}` : undefined}
        onFollowToggle={isSelf || !isAuthenticated ? undefined : toggleFollow}
      />
      <div className="flex flex-wrap gap-4 text-sm text-hd-secondary">
        <span>
          <span className="font-mono text-hd-text">{fol?.total ?? 0}</span> followers
        </span>
        <span>
          <span className="font-mono text-hd-text">{fing?.total ?? 0}</span> following
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Solutions submitted', value: String(uiUser.challengesSolved) },
          { label: 'Rep', value: String(uiUser.rep) },
          { label: 'Current streak', value: String(uiUser.streak) },
          { label: 'Weekly delta', value: String(data.weeklyRepDelta) },
        ].map((s) => (
          <div key={s.label} className="rounded-[12px] border border-hd-border bg-hd-card p-4">
            <p className="font-mono text-[11px] uppercase tracking-wide text-hd-muted">{s.label}</p>
            <p className="mt-2 font-mono text-xl font-medium text-hd-text tabular-nums">
              {s.value}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-[12px] border border-hd-border bg-hd-card p-6">
        <h2 className="mb-4 text-sm font-medium text-hd-text">Skills by category</h2>
        <SkillBarChart skills={uiUser.skills} categoryRanks={uiUser.categoryRanks} />
      </div>
      <section id="pinned">
        <h2 className="mb-4 text-sm font-medium text-hd-text">Pinned solutions</h2>
        {pinned.length === 0 ? (
          <p className="text-sm text-hd-muted">No pinned solutions yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {pinned.map((p) => {
              const rank = p.finalRank ?? p.preliminaryRank ?? null
              const rankLabel = rank != null ? `#${rank}` : '—'
              const when = p.submittedAt
                ? new Date(p.submittedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
                : '—'
              return (
                <div
                  key={p.id}
                  className="flex flex-col rounded-[12px] border border-hd-border bg-hd-card p-4"
                >
                  <Link
                    to={`/challenge/${p.challengeSlug}/solutions/${p.id}`}
                    className="text-sm font-medium leading-snug text-hd-text hover:text-hd-indigo-tint"
                  >
                    {p.challengeTitle}
                  </Link>
                  <span className="mt-2 inline-flex w-fit rounded-full border border-hd-border bg-hd-surface px-2 py-0.5 font-mono text-[11px] text-hd-secondary">
                    Rank {rankLabel}
                  </span>
                  <p className="mt-2 line-clamp-2 text-[13px] text-hd-muted">
                    {p.rationaleExcerpt}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3 text-[11px] text-hd-muted">
                    <span className="font-mono text-hd-secondary">↑ {p.upvoteCount} votes</span>
                    <span className="font-mono">{when}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-4 text-sm font-medium text-hd-text">Recent activity</h2>
        <div className="rounded-[12px] border border-hd-border bg-hd-card p-4">
          {actError && <InlineError message={actError} onRetry={() => void refetchAct()} />}
          {actLoading && !actError && <p className="text-sm text-hd-muted">Loading activity…</p>}
          {!actLoading && !actError && <ActivityFeed items={activityItems} />}
        </div>
      </section>
    </div>
  )
}
