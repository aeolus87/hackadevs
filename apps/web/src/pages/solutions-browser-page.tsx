import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useChallenge } from '@/hooks/challenges/useChallenge'
import { useSubmissions } from '@/hooks/submissions/useSubmissions'
import { InlineError } from '@/components/inline-error'
import { SkeletonCard } from '@/components/skeleton-card'

export default function SolutionsBrowserPage() {
  const { slug = '' } = useParams()
  const { data: ch, loading: chLoading, error: chError, refetch: refetchCh } = useChallenge(slug)
  const [page, setPage] = useState(1)
  const {
    data: subs,
    loading: subsLoading,
    error: subsError,
    refetch: refetchSubs,
  } = useSubmissions(ch?.id ?? '', {
    page,
    sortBy: 'compositeScore',
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (chError && !chLoading) {
    return <InlineError message="Could not load challenge." onRetry={() => void refetchCh()} />
  }

  if (!chLoading && !ch) {
    return (
      <div className="mx-auto max-w-lg text-sm text-hd-secondary">
        Challenge not found.{' '}
        <Link to="/feed" className="text-hd-indigo-tint hover:text-hd-indigo-hover">
          Home
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav className="font-mono text-[12px] text-[rgba(255,255,255,0.6)]">
        <Link to="/feed" className="hover:text-hd-text">
          Home
        </Link>
        <span className="mx-2 text-[rgba(255,255,255,0.35)]">/</span>
        <Link to={`/challenge/${slug}`} className="hover:text-hd-text">
          {ch?.title ?? slug}
        </Link>
        <span className="mx-2 text-[rgba(255,255,255,0.35)]">/</span>
        <span className="text-hd-text">Solutions</span>
      </nav>
      <h1 className="text-xl font-medium text-hd-text">Solutions</h1>
      {(chLoading || (subsLoading && ch?.id)) && (
        <div className="space-y-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      {subsError && <InlineError message={subsError} onRetry={() => void refetchSubs()} />}
      <ul className="space-y-2">
        {subs?.data.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
              className="flex w-full flex-col rounded-[12px] border border-hd-border bg-hd-card p-4 text-left hover:border-hd-border-hover"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-hd-muted">
                  #{s.finalRank ?? s.preliminaryRank ?? '—'}
                </span>
                <span className="text-sm text-hd-secondary">
                  ↑ {s.upvoteCount} · ↓ {s.downvoteCount}
                </span>
              </div>
              {selectedId === s.id && (
                <p className="mt-2 line-clamp-3 text-sm text-hd-muted">
                  {s.rationaleSummary ?? s.rationaleApproach.slice(0, 200)}
                </p>
              )}
              <Link
                to={`/challenge/${slug}/solutions/${s.id}`}
                className="mt-2 text-sm font-medium text-hd-indigo-tint hover:text-hd-indigo-hover"
                onClick={(e) => e.stopPropagation()}
              >
                Open full solution →
              </Link>
            </button>
          </li>
        ))}
      </ul>
      {subs?.hasMore && (
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          className="rounded-full border border-hd-border px-4 py-2 text-sm text-hd-text hover:border-hd-border-hover"
        >
          Load more
        </button>
      )}
    </div>
  )
}
