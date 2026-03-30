import type { ChallengeDifficulty, RepEventType } from '@prisma/client'

export type RepBreakdownPart = {
  type: RepEventType
  amount: number
  note: string
}

export type RepAwardInput = {
  difficulty: ChallengeDifficulty
  finalRank: number
  testScorePercent: number
  rationaleScore: number
  hoursAfterOpen: number
  challengeWindowHours: number
  streakDays: number
}

export function difficultyRepBase(difficulty: ChallengeDifficulty): number {
  switch (difficulty) {
    case 'BEGINNER':
      return 50
    case 'MEDIUM':
      return 120
    case 'HARD':
      return 200
    case 'LEGENDARY':
      return 360
    default:
      return 100
  }
}

export function rankMultiplier(finalRank: number): number {
  if (finalRank <= 1) return 1.5
  if (finalRank === 2) return 1.25
  if (finalRank === 3) return 1.1
  if (finalRank <= 10) return 1.02
  return 1
}

export function rankExtraFromBase(base: number, finalRank: number): number {
  const m = rankMultiplier(finalRank)
  return Math.round(base * (m - 1))
}

export function speedBonusAmount(hoursAfterOpen: number, windowHours: number): number {
  const w = Math.max(1, windowHours)
  const ratio = Math.min(1, Math.max(0, hoursAfterOpen / w))
  return Math.round((1 - ratio) * 150)
}

export function testRepBonus(testScorePercent: number): number {
  return Math.round(Math.min(100, Math.max(0, testScorePercent)) * 2)
}

export function rationaleRepBonus(rationaleScore: number): number {
  return Math.round(Math.min(100, Math.max(0, rationaleScore)) * 3)
}

export function streakRepBonus(streakDays: number): number {
  if (streakDays >= 30) return 40
  if (streakDays >= 14) return 25
  if (streakDays >= 7) return 15
  if (streakDays >= 3) return 8
  return 0
}

export function computeRepAwardBreakdown(input: RepAwardInput): RepBreakdownPart[] {
  const base = difficultyRepBase(input.difficulty)
  const testB = testRepBonus(input.testScorePercent)
  const rankEx = rankExtraFromBase(base, input.finalRank)
  const speed = speedBonusAmount(input.hoursAfterOpen, input.challengeWindowHours)
  const ratB = rationaleRepBonus(input.rationaleScore)
  const strB = streakRepBonus(input.streakDays)

  const parts: RepBreakdownPart[] = [
    { type: 'SUBMISSION_BASE', amount: base, note: `difficulty:${input.difficulty}` },
    { type: 'SUBMISSION_BASE', amount: testB, note: 'test_score' },
  ]
  if (rankEx !== 0) {
    parts.push({ type: 'RANK_MULTIPLIER', amount: rankEx, note: `rank:${input.finalRank}` })
  }
  if (speed > 0) {
    parts.push({ type: 'SPEED_BONUS', amount: speed, note: 'speed' })
  }
  if (ratB > 0) {
    parts.push({ type: 'RATIONALE_BONUS', amount: ratB, note: 'rationale' })
  }
  if (strB > 0) {
    parts.push({ type: 'STREAK_BONUS', amount: strB, note: 'streak' })
  }
  return parts
}

export function totalRepFromBreakdown(parts: RepBreakdownPart[]): number {
  return parts.reduce((s, p) => s + p.amount, 0)
}

export function computeRepAwardTotal(input: RepAwardInput): number {
  return totalRepFromBreakdown(computeRepAwardBreakdown(input))
}

export function repVoteWeight(voterTotalRepStored: number): number {
  return voterTotalRepStored > 1000 ? 1.5 : 1
}
