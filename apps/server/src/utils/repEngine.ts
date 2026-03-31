import type { ChallengeDifficulty, UserTier } from '@prisma/client'

export const DIFFICULTY_MULTIPLIER: Record<ChallengeDifficulty, number> = {
  BEGINNER: 1.0,
  MEDIUM: 2.0,
  HARD: 3.5,
  LEGENDARY: 6.0,
}

export const BASE_REP: Record<ChallengeDifficulty, number> = {
  BEGINNER: 50,
  MEDIUM: 100,
  HARD: 100,
  LEGENDARY: 100,
}

export function getRankMultiplier(rank: number): number {
  if (rank === 1) return 3.0
  if (rank <= 3) return 2.0
  if (rank <= 10) return 1.5
  if (rank <= 50) return 1.2
  if (rank <= 200) return 1.0
  return 0.7
}

export function getSpeedBonus(submittedAt: Date, opensAt: Date): number {
  const hoursElapsed = (submittedAt.getTime() - opensAt.getTime()) / 3600000
  if (hoursElapsed < 24) return 1.2
  if (hoursElapsed < 72) return 1.1
  return 1.0
}

export function getTestMultiplier(testScore: number): number {
  if (testScore >= 100) return 1.0
  if (testScore >= 80) return 0.8
  if (testScore >= 50) return 0.5
  return 0
}

export function getRationaleBonus(rationaleScore: number): number {
  if (rationaleScore >= 90) return 50
  if (rationaleScore >= 75) return 25
  if (rationaleScore >= 60) return 10
  return 0
}

export function getCommunityVoteBonus(votePercentile: number): number {
  if (votePercentile >= 90) return 30
  if (votePercentile >= 75) return 15
  if (votePercentile >= 50) return 5
  return 0
}

export function getStreakBonus(streakDays: number): number {
  if (streakDays >= 100) return 0.15
  if (streakDays >= 30) return 0.1
  if (streakDays >= 7) return 0.05
  return 0
}

export function calculateSubmissionRep(params: {
  difficulty: ChallengeDifficulty
  rank: number
  submittedAt: Date
  opensAt: Date
  testScore: number
  rationaleScore: number
  streakDays: number
}): number {
  const base = BASE_REP[params.difficulty]
  const raw =
    base *
    DIFFICULTY_MULTIPLIER[params.difficulty] *
    getRankMultiplier(params.rank) *
    getSpeedBonus(params.submittedAt, params.opensAt) *
    getTestMultiplier(params.testScore)
  const withStreak = raw * (1 + getStreakBonus(params.streakDays))
  return Math.round(withStreak) + getRationaleBonus(params.rationaleScore)
}

export function calculateCompositeScore(
  testScore: number,
  rationaleScore: number,
  voteScore: number,
): number {
  return testScore * 0.4 + rationaleScore * 0.35 + voteScore * 0.25
}

export function calculateVoteScore(upvotes: number, downvotes: number): number {
  const total = upvotes + downvotes * 1.5
  if (total < 5) return 50
  return Math.round((upvotes / total) * 100)
}

const HIGH_REP_VOTE_WEIGHT_THRESHOLD = 1000
const HIGH_REP_VOTER_MULTIPLIER = 1.5

export function voterRepWeight(voterRepAtTime: number): number {
  return voterRepAtTime > HIGH_REP_VOTE_WEIGHT_THRESHOLD ? HIGH_REP_VOTER_MULTIPLIER : 1
}

export type VoteScoreRow = { value: 'UP' | 'DOWN'; voterRepAtTime: number }

export function calculateWeightedVoteScore(rows: VoteScoreRow[]): {
  voteScore: number
  upvoteCount: number
  downvoteCount: number
} {
  let upvoteCount = 0
  let downvoteCount = 0
  let weightedUp = 0
  let weightedDown = 0
  for (const r of rows) {
    const w = voterRepWeight(r.voterRepAtTime)
    if (r.value === 'UP') {
      upvoteCount += 1
      weightedUp += w
    } else {
      downvoteCount += 1
      weightedDown += w
    }
  }
  const rawTotal = upvoteCount + downvoteCount
  if (rawTotal < 5) {
    return { voteScore: 50, upvoteCount, downvoteCount }
  }
  const denom = weightedUp + weightedDown * 1.5
  if (denom <= 0) return { voteScore: 50, upvoteCount, downvoteCount }
  return {
    voteScore: Math.round((weightedUp / denom) * 100),
    upvoteCount,
    downvoteCount,
  }
}

export function getTierFromRep(totalRep: number): UserTier {
  if (totalRep < 500) return 'NOVICE'
  if (totalRep < 2000) return 'APPRENTICE'
  if (totalRep < 7500) return 'ENGINEER'
  if (totalRep < 25000) return 'SENIOR'
  if (totalRep < 75000) return 'STAFF'
  if (totalRep < 200000) return 'PRINCIPAL'
  return 'LEGEND'
}

export function getDecayAmount(rep: number, weeksInactive: number): number {
  return Math.round(rep * 0.005 * weeksInactive)
}
