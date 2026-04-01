import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SolutionVoteBar } from '@/components/solution-vote-bar'
import { HdModal } from '@/components/ui/hd-modal'
import { useAuthUser } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { useChallenge } from '@/hooks/challenges/useChallenge'
import { useCastVote } from '@/hooks/votes/useCastVote'
import { useRetractVote } from '@/hooks/votes/useRetractVote'
import { useSubmission } from '@/hooks/submissions/useSubmission'
import { useWithdrawForRevision } from '@/hooks/submissions/useWithdrawForRevision'
import { useVoteCounts } from '@/hooks/votes/useVoteCounts'
import { parseAxiosError } from '@/utils/axios-message'
import { getVotingState } from '@/utils/voting-ui'

export default function SolutionViewerPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { isAuthenticated, user } = useAuthUser()
  const { withdraw: withdrawForRevision, loading: withdrawBusy } = useWithdrawForRevision()
  const { slug = '', id = '' } = useParams()
  const { data: chApi } = useChallenge(slug)
  const { data: sub, loading } = useSubmission(id)
  const [voteCastAt, setVoteCastAt] = useState<number | null>(null)
  const [nowTick, setNowTick] = useState(() => Date.now())

  const votingState =
    chApi?.closesAt != null
      ? getVotingState(chApi.closesAt, chApi.votingSettled)
      : ('active' as const)
  const votingOpen = votingState === 'voting_open'

  const { data: counts, refetch: refetchCounts } = useVoteCounts(id, {
    pollEnabled: votingOpen,
  })

  const { mutate: castVote, loading: castBusy } = useCastVote(() => {
    void refetchCounts()
  })
  const { mutate: retractVote, loading: retractBusy } = useRetractVote(() => {
    void refetchCounts()
    setVoteCastAt(null)
  })

  const canRetract = useMemo(() => {
    if (!counts?.userVote || voteCastAt == null) return false
    return Date.now() - voteCastAt < 5 * 60 * 1000
  }, [counts?.userVote, voteCastAt])

  useEffect(() => {
    if (!canRetract || voteCastAt == null) return
    const t = window.setInterval(() => setNowTick(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [canRetract, voteCastAt])

  const retractSecondsRemaining = useMemo(() => {
    if (voteCastAt == null || !canRetract) return null
    const msLeft = 5 * 60 * 1000 - (nowTick - voteCastAt)
    return Math.max(0, Math.ceil(msLeft / 1000))
  }, [voteCastAt, canRetract, nowTick])

  const [copied, setCopied] = useState(false)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)

  if (!id) {
    return (
      <div className="mx-auto max-w-lg text-sm text-hd-secondary">
        Invalid solution.{' '}
        <Link to="/feed" className="text-hd-indigo-tint">
          Home
        </Link>
      </div>
    )
  }

  if (loading && !sub) {
    return (
      <div className="mx-auto max-w-lg animate-pulse rounded-[12px] bg-[rgba(255,255,255,0.04)] p-8 text-sm text-hd-muted">
        Loading…
      </div>
    )
  }

  if (!loading && !sub) {
    return (
      <div className="mx-auto max-w-lg text-sm text-hd-secondary">
        Solution not found.{' '}
        <Link to="/feed" className="text-hd-indigo-tint">
          Home
        </Link>
      </div>
    )
  }

  const sol = sub
    ? {
        code: sub.code,
        language: sub.language,
        solver: {
          displayName: sub.user?.displayName ?? 'Solver',
          avatar:
            sub.user?.avatarUrl ??
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.user?.username ?? id}`,
        },
        rankLabel: (() => {
          const r = sub.finalRank ?? sub.preliminaryRank
          return r != null ? `#${r}` : '—'
        })(),
        submittedLabel: (() => {
          const raw = sub.submittedAt
          if (!raw) return null
          const d = new Date(raw)
          if (Number.isNaN(d.getTime())) return null
          return d.toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        })(),
        rationale: {
          approach: sub.rationaleApproach ?? '',
          tradeoffs: sub.rationaleTradeoffs ?? '',
          scale: sub.rationaleScale ?? '',
        },
        upvotes: sub.upvoteCount,
        downvotes: sub.downvoteCount,
      }
    : null

  if (!sol) {
    return null
  }

  const up = counts?.upvoteCount ?? sol.upvotes
  const down = counts?.downvoteCount ?? sol.downvotes
  const userVote = counts?.userVote ?? null

  const copy = async () => {
    await navigator.clipboard.writeText(sol.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const isOwnerPublished = sub != null && user?.id === sub.userId && sub.status === 'PUBLISHED'
  const revisionWindowOpen =
    chApi?.status === 'ACTIVE' && chApi.closesAt != null && new Date(chApi.closesAt) > new Date()

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-16">
      {isOwnerPublished && revisionWindowOpen ? (
        <div className="rounded-[12px] border border-hd-amber/35 bg-hd-amber/10 px-4 py-3 text-sm text-hd-secondary">
          <span className="text-hd-text">Want to improve?</span> You can withdraw this publish and
          edit again on the submit page while the challenge is open.{' '}
          <button
            type="button"
            disabled={withdrawBusy}
            onClick={() => setWithdrawModalOpen(true)}
            className="font-medium text-hd-indigo-tint hover:text-hd-indigo-hover disabled:opacity-40"
          >
            Revise & resubmit
          </button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-4 border-b border-hd-border pb-6">
        <img
          src={sol.solver.avatar}
          alt=""
          className="h-12 w-12 rounded-full"
          width={48}
          height={48}
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-hd-text">{sol.solver.displayName}</p>
          <p className="font-mono text-xs text-hd-muted">
            Rank {sol.rankLabel}
            {sol.submittedLabel ? ` · ${sol.submittedLabel}` : ''}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-hd-border bg-hd-surface">
        <div className="flex items-center justify-between border-b border-hd-border px-3 py-2">
          <span className="font-mono text-[11px] text-hd-muted">{sol.language}</span>
          <button
            type="button"
            onClick={copy}
            className="rounded-md border border-hd-border px-2 py-1 font-mono text-[11px] text-hd-secondary hover:border-hd-border-hover hover:text-hd-text"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="m-0 overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-hd-indigo-tint">
          <code>{sol.code}</code>
        </pre>
      </div>

      <div className="space-y-6">
        {(
          [
            ['Approach', sol.rationale.approach],
            ['Tradeoffs', sol.rationale.tradeoffs],
            ['Scale considerations', sol.rationale.scale],
          ] as const
        ).map(([label, body]) => (
          <section key={label} className="border-l-2 border-hd-indigo pl-4">
            <p className="font-mono text-[10px] uppercase tracking-wide text-hd-muted">{label}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-hd-secondary">
              {body.trim() ? body : '—'}
            </p>
          </section>
        ))}
      </div>

      {sub && votingOpen && isAuthenticated && (
        <SolutionVoteBar
          upvoteCount={up}
          downvoteCount={down}
          userVote={userVote}
          canRetract={canRetract}
          retractSecondsRemaining={retractSecondsRemaining}
          busy={castBusy || retractBusy}
          onUpvote={async () => {
            try {
              await castVote({ submissionId: id, value: 'UP' })
              setVoteCastAt(Date.now())
            } catch {
              /* toast in hook */
            }
          }}
          onDownvote={async () => {
            try {
              await castVote({ submissionId: id, value: 'DOWN' })
              setVoteCastAt(Date.now())
            } catch {
              /* toast in hook */
            }
          }}
          onRetract={() => void retractVote(id)}
        />
      )}
      {sub && votingOpen && !isAuthenticated && (
        <div className="rounded-[12px] border border-hd-border bg-hd-card px-6 py-8 text-center">
          <p className="mb-4 text-sm font-medium text-hd-text">Sign in to vote on solutions</p>
          <Link
            to="/login"
            state={{ returnTo: `/challenge/${slug}/solutions/${id}` }}
            className="inline-flex rounded-full bg-hd-indigo px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-hd-indigo-hover"
          >
            Sign in
          </Link>
        </div>
      )}
      {sub && !votingOpen && chApi?.closesAt && (
        <div className="rounded-[12px] border border-hd-border bg-hd-card px-6 py-8 text-center text-sm text-hd-muted">
          {votingState === 'active' && 'Voting opens after the challenge closes.'}
          {votingState === 'voting_closed' && 'Finalising results — voting has closed.'}
          {votingState === 'results_final' && 'Results are final.'}
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-sm font-medium text-hd-text">Comments</h2>
        <p className="text-sm text-hd-muted">Comments coming soon.</p>
      </div>

      <div className="flex flex-wrap justify-between gap-4 border-t border-hd-border pt-8">
        <Link
          to={`/challenge/${slug}`}
          className="text-sm font-medium text-hd-indigo-tint hover:text-hd-indigo-hover"
        >
          Back to challenge
        </Link>
        <Link
          to={`/challenge/${slug}/solutions`}
          className="text-sm font-medium text-hd-secondary hover:text-hd-text"
        >
          All solutions
        </Link>
      </div>

      <HdModal
        open={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        title="Withdraw and edit again?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setWithdrawModalOpen(false)}
              className="rounded-full border border-hd-border px-4 py-2 text-sm font-medium text-hd-text hover:bg-hd-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={withdrawBusy}
              onClick={() => {
                void (async () => {
                  try {
                    await withdrawForRevision(id)
                    setWithdrawModalOpen(false)
                    toast.push('Back to draft — opening submit page.', 'success')
                    navigate(`/challenge/${slug}/submit`)
                  } catch (e) {
                    const msg = parseAxiosError(e).message
                    if (msg.includes('revision_window_closed')) {
                      toast.push('The challenge is no longer open for revisions.', 'error')
                    } else {
                      toast.push(msg || 'Could not withdraw', 'error')
                    }
                  }
                })()
              }}
              className="rounded-full bg-hd-indigo px-4 py-2 text-sm font-medium text-white hover:bg-hd-indigo-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              Withdraw to draft
            </button>
          </>
        }
      >
        <p>
          Your entry will leave the public list until you publish again. Rep tied to this submission
          for this challenge will be reversed. You keep your code to edit from.
        </p>
      </HdModal>
    </div>
  )
}
