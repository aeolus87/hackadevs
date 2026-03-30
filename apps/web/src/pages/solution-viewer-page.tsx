import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SolutionVoteBar } from '@/components/solution-vote-bar'
import { useChallenge } from '@/hooks/challenges/useChallenge'
import { useCastVote } from '@/hooks/votes/useCastVote'
import { useRetractVote } from '@/hooks/votes/useRetractVote'
import { useVoteCounts } from '@/hooks/votes/useVoteCounts'
import { useSubmission } from '@/hooks/submissions/useSubmission'
import { mockComments, mockSolutionViewer } from '@/data/mock'

function votingPollOpen(closesAt?: string): boolean {
  if (!closesAt) return false
  return Date.now() < new Date(closesAt).getTime() + 48 * 3600000
}

export default function SolutionViewerPage() {
  const { slug = '', id = '' } = useParams()
  const { data: chApi } = useChallenge(slug)
  const { data: sub, loading } = useSubmission(id)
  const [voteCastAt, setVoteCastAt] = useState<number | null>(null)

  const { data: counts, refetch: refetchCounts } = useVoteCounts(id, {
    pollEnabled: votingPollOpen(chApi?.closesAt),
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

  const [copied, setCopied] = useState(false)

  const fallback =
    mockSolutionViewer.challengeSlug === slug && mockSolutionViewer.id === id
      ? mockSolutionViewer
      : null

  if (!id) {
    return (
      <div className="mx-auto max-w-lg text-sm text-hd-secondary">
        Invalid solution.{' '}
        <Link to="/feed" className="text-hd-indigo-tint">
          Feed
        </Link>
      </div>
    )
  }

  if (loading && !sub && !fallback) {
    return (
      <div className="mx-auto max-w-lg animate-pulse rounded-[12px] bg-[rgba(255,255,255,0.04)] p-8 text-sm text-hd-muted">
        Loading…
      </div>
    )
  }

  if (!loading && !sub && !fallback) {
    return (
      <div className="mx-auto max-w-lg text-sm text-hd-secondary">
        Solution not found.{' '}
        <Link to="/feed" className="text-hd-indigo-tint">
          Feed
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
        rank: sub.finalRank ?? sub.preliminaryRank ?? 0,
        total: 0,
        submittedAt: sub.submittedAt ?? '',
        rationale: {
          approach: sub.rationaleApproach,
          tradeoffs: sub.rationaleTradeoffs,
          scale: sub.rationaleScale,
        },
        upvotes: sub.upvoteCount,
        downvotes: sub.downvoteCount,
      }
    : fallback
      ? {
          code: fallback.code,
          language: fallback.language,
          solver: fallback.solver,
          rank: fallback.rank,
          total: fallback.total,
          submittedAt: fallback.submittedAt,
          rationale: fallback.rationale,
          upvotes: fallback.upvotes,
          downvotes: fallback.downvotes,
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

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-16">
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
            Rank #{sol.rank}
            {sol.total ? ` of ${sol.total}` : ''} · {sol.submittedAt}
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
            <p className="mt-2 text-sm leading-relaxed text-hd-secondary">{body}</p>
          </section>
        ))}
      </div>

      {sub && (
        <SolutionVoteBar
          upvoteCount={up}
          downvoteCount={down}
          userVote={userVote}
          canRetract={canRetract}
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

      {fallback && !sub && (
        <SolutionVoteBar
          upvoteCount={sol.upvotes}
          downvoteCount={sol.downvotes}
          userVote={null}
          canRetract={false}
          onUpvote={() => {}}
          onDownvote={() => {}}
          onRetract={() => {}}
        />
      )}

      <div className="space-y-6">
        <h2 className="text-sm font-medium text-hd-text">Comments</h2>
        {mockComments.map((c) => (
          <div key={c.id} className="rounded-[12px] border border-hd-border bg-hd-card p-4">
            <div className="flex items-center gap-2">
              <img
                src={c.author.avatar}
                alt=""
                className="h-8 w-8 rounded-full"
                width={32}
                height={32}
              />
              <div>
                <span className="text-sm font-medium text-hd-text">{c.author.name}</span>
                <span className="ml-2 font-mono text-[10px] text-hd-muted">
                  rank #{c.author.rank}
                </span>
              </div>
              <span className="ml-auto font-mono text-[11px] text-hd-muted">{c.time}</span>
            </div>
            <p className="mt-2 text-sm text-hd-secondary">{c.body}</p>
            <div className="mt-3 rounded-lg border border-hd-border bg-hd-surface p-2 font-mono text-[12px]">
              <div className="text-hd-emerald">+ await outbox.enqueue(event)</div>
              <div className="text-hd-rose">- await bus.publish(event)</div>
            </div>
            {c.replies?.map((r) => (
              <div key={r.id} className="ml-6 mt-4 border-l border-hd-border pl-4">
                <div className="flex items-center gap-2">
                  <img
                    src={r.author.avatar}
                    alt=""
                    className="h-7 w-7 rounded-full"
                    width={28}
                    height={28}
                  />
                  <span className="text-sm font-medium text-hd-text">{r.author.name}</span>
                  <span className="font-mono text-[10px] text-hd-muted">rank #{r.author.rank}</span>
                  <span className="ml-auto font-mono text-[11px] text-hd-muted">{r.time}</span>
                </div>
                <p className="mt-2 text-sm text-hd-secondary">{r.body}</p>
              </div>
            ))}
          </div>
        ))}
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
    </div>
  )
}
