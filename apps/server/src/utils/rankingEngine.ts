import type { ChallengeDifficulty } from '@prisma/client'
import { calculateCompositeScore as calcComposite } from './repEngine.js'

export type CompositeInput = {
  testScorePercent: number
  rationaleScorePercent: number
  voteScorePercent: number
}

const W_TEST = 0.4
const W_RATIONALE = 0.35
const W_VOTE = 0.25

export function compositeScore(input: CompositeInput): number {
  const t = clamp(input.testScorePercent, 0, 100)
  const r = clamp(input.rationaleScorePercent, 0, 100)
  const v = clamp(input.voteScorePercent, 0, 100)
  return Math.round((t * W_TEST + r * W_RATIONALE + v * W_VOTE) * 100) / 100
}

export function calculateCompositeScore(
  testScore: number,
  rationaleScore: number,
  voteScore: number,
): number {
  return calcComposite(testScore, rationaleScore, voteScore)
}

export function difficultyRankWeight(difficulty: ChallengeDifficulty): number {
  switch (difficulty) {
    case 'BEGINNER':
      return 1
    case 'MEDIUM':
      return 1.15
    case 'HARD':
      return 1.35
    case 'LEGENDARY':
      return 1.6
    default:
      return 1
  }
}

export function assignPreliminaryOrder(
  scores: { submissionId: string; composite: number }[],
): { submissionId: string; rank: number }[] {
  const sorted = [...scores].sort((a, b) => b.composite - a.composite)
  return sorted.map((s, i) => ({ submissionId: s.submissionId, rank: i + 1 }))
}

export function assignRanks(
  submissions: {
    id: string
    compositeScore: number
    rationaleScore: number
    submittedAt: Date
  }[],
): Map<string, number> {
  const sorted = [...submissions].sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) return b.compositeScore - a.compositeScore
    if (b.rationaleScore !== a.rationaleScore) return b.rationaleScore - a.rationaleScore
    return a.submittedAt.getTime() - b.submittedAt.getTime()
  })
  const m = new Map<string, number>()
  sorted.forEach((s, i) => m.set(s.id, i + 1))
  return m
}

export function getVotePercentile(submissionVoteScore: number, allVoteScores: number[]): number {
  if (allVoteScores.length === 0) return 0
  const lower = allVoteScores.filter((s) => s < submissionVoteScore).length
  return (lower / allVoteScores.length) * 100
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}
