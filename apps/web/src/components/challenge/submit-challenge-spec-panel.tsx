import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Challenge } from '@/types/hackadevs-api.types'

type Props = {
  challenge: Challenge
}

export function SubmitChallengeSpecPanel({ challenge }: Props) {
  const [open, setOpen] = useState(true)
  const detailHref = `/challenge/${challenge.slug}`
  const hasExamples = Boolean(challenge.exampleInput?.trim() || challenge.exampleOutput?.trim())

  return (
    <details
      className="mb-6 rounded-[12px] border border-hd-border bg-hd-card open:[&_svg.chevron]:rotate-180"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-hd-text [&::-webkit-details-marker]:hidden">
        <span>Challenge brief</span>
        <svg
          className="chevron h-4 w-4 shrink-0 text-hd-muted transition-transform duration-200"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </summary>
      <div className="space-y-4 border-t border-hd-border px-4 pb-4 pt-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-hd-secondary">
          {challenge.problemStatement}
        </p>

        {challenge.constraints.length > 0 ? (
          <div className="rounded-[10px] border border-hd-border bg-hd-surface p-3">
            <h3 className="font-mono text-[11px] uppercase tracking-wide text-hd-muted">
              Constraints
            </h3>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-hd-secondary">
              {challenge.constraints.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {challenge.bonusObjective?.trim() ? (
          <div className="rounded-[10px] border border-hd-amber/25 bg-hd-amber/10 p-3">
            <h3 className="font-mono text-[11px] uppercase tracking-wide text-hd-amber-light">
              Bonus
            </h3>
            <p className="mt-2 text-sm text-hd-secondary">{challenge.bonusObjective}</p>
          </div>
        ) : null}

        {hasExamples ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {challenge.exampleInput?.trim() ? (
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-hd-muted">
                  Example input
                </p>
                <pre className="mt-1.5 max-h-40 overflow-auto rounded-lg border border-hd-border bg-hd-page p-3 font-mono text-[12px] leading-relaxed text-hd-indigo-tint">
                  {challenge.exampleInput}
                </pre>
              </div>
            ) : null}
            {challenge.exampleOutput?.trim() ? (
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-hd-muted">
                  Example output
                </p>
                <pre className="mt-1.5 max-h-40 overflow-auto rounded-lg border border-hd-border bg-hd-page p-3 font-mono text-[12px] leading-relaxed text-hd-indigo-tint">
                  {challenge.exampleOutput}
                </pre>
              </div>
            ) : null}
          </div>
        ) : null}

        <p className="text-[13px] text-hd-muted">
          <Link
            to={detailHref}
            className="font-medium text-hd-indigo-tint transition-colors hover:text-hd-indigo-hover"
          >
            Open full challenge page
          </Link>{' '}
          for discussion and full context.
        </p>
      </div>
    </details>
  )
}
