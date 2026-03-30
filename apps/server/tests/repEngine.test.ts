import { describe, it, expect } from 'vitest'
import {
  computeRepAwardTotal,
  difficultyRepBase,
  rankExtraFromBase,
  repVoteWeight,
  speedBonusAmount,
  testRepBonus,
  rationaleRepBonus,
} from '../src/utils/repEngine.js'

describe('repEngine', () => {
  it('Hard, rank 2, 36h into 100h window, 100% tests, rationale 88, streak 0 totals 810', () => {
    const total = computeRepAwardTotal({
      difficulty: 'HARD',
      finalRank: 2,
      testScorePercent: 100,
      rationaleScore: 88,
      hoursAfterOpen: 36,
      challengeWindowHours: 100,
      streakDays: 0,
    })
    expect(total).toBe(810)
  })

  it('difficultyRepBase HARD is 200', () => {
    expect(difficultyRepBase('HARD')).toBe(200)
  })

  it('rankExtraFromBase for rank 2 is 50 when base is 200', () => {
    expect(rankExtraFromBase(200, 2)).toBe(50)
  })

  it('speedBonus for 36/100 window uses (1-ratio)*150', () => {
    expect(speedBonusAmount(36, 100)).toBe(96)
  })

  it('testRepBonus scales percentage by 2', () => {
    expect(testRepBonus(100)).toBe(200)
  })

  it('rationaleRepBonus scales by 3', () => {
    expect(rationaleRepBonus(88)).toBe(264)
  })

  it('repVoteWeight is 1.5 when rep > 1000', () => {
    expect(repVoteWeight(1001)).toBe(1.5)
    expect(repVoteWeight(1000)).toBe(1)
  })
})
