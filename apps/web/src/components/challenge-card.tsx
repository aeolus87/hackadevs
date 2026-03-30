import { Link } from 'react-router-dom'
import type { Challenge } from '@/types/hackadevs'
import { DifficultyBadge } from '@/components/difficulty-badge'
import { TagPill } from '@/components/tag-pill'

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const visible = challenge.tags.slice(0, 4)
  const more = challenge.tags.length - visible.length

  return (
    <Link
      to={`/challenge/${challenge.slug}`}
      className="block rounded-[12px] border border-hd-border bg-hd-card p-4 transition-[border-color] duration-150 ease-out hover:border-[rgba(99,102,241,0.3)]"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={challenge.difficulty} />
        <span className="font-mono text-[12px] text-hd-muted">closes in {challenge.closesIn}</span>
        {challenge.company && (
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-hd-muted">
            {challenge.company.favicon && (
              <img
                src={challenge.company.favicon}
                alt=""
                className="h-3.5 w-3.5 rounded-sm"
                width={14}
                height={14}
              />
            )}
            via {challenge.company.name}
          </span>
        )}
      </div>
      <h3 className="mb-2 text-base font-medium text-hd-text">{challenge.title}</h3>
      <p className="mb-3 line-clamp-2 text-sm text-hd-secondary">{challenge.description}</p>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {visible.map((t) => (
          <TagPill key={t}>{t}</TagPill>
        ))}
        {more > 0 && <TagPill>{`+${more} more`}</TagPill>}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-hd-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-hd-emerald" aria-hidden />
          {challenge.submissionCount} submissions
        </span>
        <span className="font-mono text-[12px]">{challenge.voteRate}% upvoted</span>
        <span className="ml-auto flex items-center gap-2">
          <img
            src={challenge.postedBy.avatar}
            alt=""
            className="h-6 w-6 rounded-full"
            width={24}
            height={24}
          />
          <span className="text-hd-text">{challenge.postedBy.name}</span>
        </span>
      </div>
    </Link>
  )
}
