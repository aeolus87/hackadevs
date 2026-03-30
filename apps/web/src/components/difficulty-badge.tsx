import type { Difficulty } from '@/types/hackadevs'

const styles: Record<Difficulty, string> = {
  Beginner: 'bg-hd-emerald/15 text-hd-emerald-light border-hd-emerald/35',
  Medium: 'bg-hd-amber/15 text-hd-amber-light border-hd-amber/35',
  Hard: 'bg-hd-rose/15 text-hd-rose-light border-hd-rose/35',
  Legendary: 'bg-hd-indigo-surface text-hd-indigo-tint border-hd-indigo/40',
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[12px] font-medium ${styles[difficulty]}`}
    >
      {difficulty}
    </span>
  )
}
