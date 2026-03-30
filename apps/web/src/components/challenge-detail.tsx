import type { Challenge } from '@/types/hackadevs'

type ChallengeDetailProps = {
  challenge: Challenge
}

export function ChallengeDetail({ challenge }: ChallengeDetailProps) {
  return (
    <article className="max-w-none">
      <h2 className="text-lg font-medium text-hd-text">Problem</h2>
      <p className="mt-2 text-sm leading-relaxed text-hd-secondary">{challenge.description}</p>
      <p className="mt-3 text-sm leading-relaxed text-hd-secondary">
        You are designing for production traffic, on-call rotations, and incremental rollout. Prefer
        concrete interfaces, failure modes, and observability over buzzwords.
      </p>
      <h3 className="mt-6 text-base font-medium text-hd-text">API sketch</h3>
      <pre className="mt-2 rounded-lg border border-hd-border bg-hd-surface p-4 font-mono text-[13px] text-hd-indigo-tint">
        <code>{`POST /v1/payments
Idempotency-Key: <uuid>
{ "amount_cents": 4999, "currency": "usd" }`}</code>
      </pre>
      {challenge.constraints && challenge.constraints.length > 0 && (
        <div className="my-6 rounded-[12px] border border-hd-border bg-hd-card p-4">
          <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-hd-muted">
            Constraints
          </h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-hd-secondary">
            {challenge.constraints.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {challenge.bonusObjectives && challenge.bonusObjectives.length > 0 && (
        <div className="my-6 rounded-[12px] border border-hd-amber/25 bg-hd-amber/10 p-4">
          <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-hd-amber-light">
            Bonus objectives
          </h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-hd-secondary">
            {challenge.bonusObjectives.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
