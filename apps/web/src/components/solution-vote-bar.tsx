import type { VoteValue } from '@/types/hackadevs-api.types'

type SolutionVoteBarProps = {
  upvoteCount: number
  downvoteCount: number
  userVote: VoteValue | null
  canRetract: boolean
  retractSecondsRemaining?: number | null
  busy?: boolean
  onUpvote: () => void
  onDownvote: () => void
  onRetract: () => void
}

export function SolutionVoteBar({
  upvoteCount,
  downvoteCount,
  userVote,
  canRetract,
  retractSecondsRemaining,
  busy,
  onUpvote,
  onDownvote,
  onRetract,
}: SolutionVoteBarProps) {
  const confirmDown = () => {
    if (!window.confirm('Downvote this solution?')) return
    onDownvote()
  }

  return (
    <div className="rounded-[12px] border border-hd-border bg-hd-card px-6 py-8 text-center">
      <p className="mb-6 text-sm font-medium text-hd-text">Was this solution elegant?</p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          disabled={busy}
          onClick={onUpvote}
          className="rounded-full border border-hd-border bg-hd-surface px-8 py-3 font-medium text-hd-text transition-colors duration-150 ease-out hover:border-hd-indigo/40 hover:text-hd-indigo-tint disabled:cursor-not-allowed disabled:opacity-40"
        >
          Upvote · {upvoteCount}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={confirmDown}
          className="rounded-full border border-hd-border bg-hd-surface px-8 py-3 font-medium text-hd-secondary transition-colors duration-150 ease-out hover:border-hd-rose/40 hover:text-hd-rose-light disabled:cursor-not-allowed disabled:opacity-40"
        >
          Downvote · {downvoteCount}
        </button>
        {userVote && canRetract && (
          <button
            type="button"
            disabled={busy}
            onClick={onRetract}
            className="rounded-full border border-hd-border px-4 py-2 text-xs font-medium text-hd-muted hover:text-hd-text disabled:opacity-40"
          >
            Retract vote
          </button>
        )}
      </div>
      {userVote && canRetract && retractSecondsRemaining != null && retractSecondsRemaining > 0 && (
        <p className="mt-4 text-xs text-hd-muted">
          Retract available for {retractSecondsRemaining}s
        </p>
      )}
    </div>
  )
}
