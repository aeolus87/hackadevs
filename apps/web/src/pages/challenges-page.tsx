import { ChallengeCard } from '@/components/challenge-card'
import { mockChallenges } from '@/data/mock'

export default function ChallengesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-medium text-hd-text">Challenges</h1>
      <p className="text-sm text-hd-secondary">
        Architectural prompts from teams that ship at scale.
      </p>
      <div className="space-y-4 pt-4">
        {mockChallenges.map((c) => (
          <ChallengeCard key={c.slug} challenge={c} />
        ))}
      </div>
    </div>
  )
}
