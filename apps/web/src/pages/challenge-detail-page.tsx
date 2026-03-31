import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChallengeDetail } from '@/components/challenge-detail'
import { DifficultyBadge } from '@/components/difficulty-badge'
import { InlineError } from '@/components/inline-error'
import { RatingDonut } from '@/components/rating-donut'
import { SkeletonCard } from '@/components/skeleton-card'
import { useAuthUser } from '@/contexts/auth-context'
import { useUnreadCount } from '@/hooks/notifications/useUnreadCount'
import { useChallenge } from '@/hooks/challenges/useChallenge'
import { useMySubmission } from '@/hooks/submissions/useMySubmission'
import { useSubmissions } from '@/hooks/submissions/useSubmissions'
import { apiChallengeToUi } from '@/utils/map-api-challenge'
import { getVotingState, votingPhaseLabel } from '@/utils/voting-ui'

export default function ChallengeDetailPage() {
  const { slug = '' } = useParams()
  const { isAuthenticated } = useAuthUser()
  useUnreadCount()
  const { data: apiCh, loading, error, refetch } = useChallenge(slug)
  const challenge = useMemo(() => (apiCh ? apiChallengeToUi(apiCh) : null), [apiCh])
  const challengeId = apiCh?.id ?? ''
  const votingState =
    apiCh?.closesAt != null
      ? getVotingState(apiCh.closesAt, apiCh.votingSettled)
      : ('active' as const)
  const votingPill = apiCh?.closesAt != null ? votingPhaseLabel(votingState, apiCh.closesAt) : null
  const { data: mine } = useMySubmission(challengeId)
  const { data: subs } = useSubmissions(challengeId, { page: 1, sortBy: 'compositeScore' })

  const submissionLangSlices = useMemo(() => {
    const list = subs?.data ?? []
    if (!list.length) return []
    const byLang = new Map<string, number>()
    for (const s of list) {
      const k = s.language ?? 'UNK'
      byLang.set(k, (byLang.get(k) ?? 0) + 1)
    }
    const total = list.length
    const colors = ['#6366f1', '#34d399', '#fbbf24', '#f472b6', '#94a3b8']
    let i = 0
    return [...byLang.entries()].map(([label, n]) => ({
      label,
      percent: Math.round((n / total) * 100),
      color: colors[i++ % colors.length] ?? '#94a3b8',
    }))
  }, [subs?.data])

  if (loading && !apiCh) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <SkeletonCard />
      </div>
    )
  }

  if (error && !apiCh) {
    return (
      <div className="mx-auto max-w-lg">
        <InlineError message={error} onRetry={() => void refetch()} />
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="mx-auto max-w-lg rounded-[12px] border border-hd-border border-l-4 border-l-hd-rose bg-hd-card p-6">
        <p className="text-sm text-hd-secondary">Challenge not found.</p>
        <Link
          to="/feed"
          className="mt-3 inline-block text-sm font-medium text-hd-indigo-tint hover:text-hd-indigo-hover"
        >
          Back to feed
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      {isAuthenticated && mine?.status === 'DRAFT' && (
        <div className="mb-4 rounded-[12px] border border-hd-amber/30 bg-hd-amber/10 px-4 py-3 text-sm text-hd-secondary">
          You have a draft in progress.{' '}
          <Link
            to={`/challenge/${challenge.slug}/submit`}
            className="font-medium text-hd-indigo-tint hover:text-hd-indigo-hover"
          >
            Resume
          </Link>
        </div>
      )}
      {isAuthenticated && mine && mine.status !== 'DRAFT' && mine.status !== 'WITHDRAWN' && (
        <div className="mb-4 rounded-[12px] border border-hd-indigo/30 bg-hd-indigo-surface px-4 py-3 text-sm text-hd-secondary">
          You already submitted this challenge.
        </div>
      )}
      <div className="rounded-[16px] border border-hd-border bg-hd-indigo-surface px-4 py-6 md:px-8 md:py-8">
        <nav className="mb-4 font-mono text-[12px] text-hd-muted">
          <Link to="/feed" className="text-hd-secondary hover:text-hd-text">
            Home
          </Link>
          <span className="mx-2 text-hd-muted">&gt;</span>
          <span>{challenge.category}</span>
          <span className="mx-2 text-hd-muted">&gt;</span>
          <span className="text-hd-text">{challenge.title}</span>
        </nav>
        <h1 className="text-2xl font-medium text-hd-text">{challenge.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-hd-secondary">
          <DifficultyBadge difficulty={challenge.difficulty} />
          <span>{challenge.category}</span>
          {challenge.company && <span>posted by {challenge.company.name}</span>}
          <span className="font-mono text-[12px]">{challenge.submissionCount} submissions</span>
          <span className="font-mono text-[12px] text-hd-muted">
            closes in {challenge.closesIn}
          </span>
        </div>
        {votingPill && (
          <div className="mt-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 font-mono text-[11px] ${
                votingState === 'active'
                  ? 'border-hd-emerald/40 bg-hd-emerald/10 text-hd-emerald'
                  : votingState === 'voting_open'
                    ? 'border-hd-indigo/40 bg-hd-indigo-surface text-hd-indigo-tint'
                    : votingState === 'voting_closed'
                      ? 'border-hd-amber/40 bg-hd-amber/10 text-hd-amber'
                      : 'border-hd-border bg-hd-surface text-hd-muted'
              }`}
            >
              {votingPill}
            </span>
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={isAuthenticated ? `/challenge/${challenge.slug}/submit` : '/login'}
            state={
              isAuthenticated ? undefined : { returnTo: `/challenge/${challenge.slug}/submit` }
            }
            className="inline-flex h-11 items-center justify-center rounded-full bg-hd-indigo px-8 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-hd-indigo-hover"
          >
            Start solving
          </Link>
          <Link
            to={`/challenge/${challenge.slug}/solutions`}
            className="inline-flex h-11 items-center justify-center rounded-full border border-hd-border px-6 text-sm font-medium text-hd-text transition-colors duration-150 ease-out hover:border-hd-border-hover"
          >
            View solutions
          </Link>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 lg:max-w-[60%]">
          <ChallengeDetail challenge={challenge} />
        </div>
        <aside className="w-full space-y-4 lg:sticky lg:top-24 lg:w-[40%] lg:max-w-md lg:self-start">
          <div className="rounded-[12px] border border-hd-border bg-hd-card p-5">
            <h3 className="mb-4 text-sm font-medium text-hd-text">Submission stats</h3>
            {submissionLangSlices.length > 0 ? (
              <RatingDonut slices={submissionLangSlices} />
            ) : (
              <p className="text-sm text-hd-muted">Stats appear once submissions are in.</p>
            )}
          </div>
          <div className="rounded-[12px] border border-hd-border bg-hd-card p-5">
            <h3 className="mb-3 text-sm font-medium text-hd-text">Top solutions by votes</h3>
            <ol className="space-y-3">
              {subs?.data && subs.data.length > 0 ? (
                subs.data.slice(0, 5).map((s, i) => (
                  <li key={s.id} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-hd-muted">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/challenge/${challenge.slug}/solutions/${s.id}`}
                        className="truncate text-sm font-medium text-hd-text hover:text-hd-indigo-tint"
                      >
                        Solution · {s.user?.displayName ?? s.userId.slice(0, 8)}
                      </Link>
                    </div>
                    <span className="font-mono text-xs text-hd-secondary">{s.upvoteCount}</span>
                  </li>
                ))
              ) : (
                <p className="text-sm text-hd-muted">No solutions to show yet.</p>
              )}
            </ol>
          </div>
          <div className="rounded-[12px] border border-hd-border bg-hd-card p-5">
            <a
              href="#discuss"
              className="text-sm font-medium text-hd-indigo-tint hover:text-hd-indigo-hover"
            >
              Discuss
            </a>
            <span className="ml-2 font-mono text-xs text-hd-muted">
              {challenge.discussCount ?? 0} comments
            </span>
          </div>
        </aside>
      </div>
      <section
        id="discuss"
        className="mt-16 scroll-mt-28 rounded-[12px] border border-hd-border bg-hd-card p-6"
      >
        <h2 className="text-base font-medium text-hd-text">Discussion</h2>
        <p className="mt-2 text-sm text-hd-muted">No comments yet. Start the thread.</p>
        <Link
          to={`/challenge/${challenge.slug}/submit`}
          className="mt-4 inline-flex rounded-full bg-hd-indigo px-4 py-2 text-sm font-medium text-white hover:bg-hd-indigo-hover"
        >
          Submit the first solution
        </Link>
      </section>
    </div>
  )
}
