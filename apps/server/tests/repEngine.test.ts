import { describe, it, expect } from 'vitest'
import {
  calculateSubmissionRep,
  calculateWeightedVoteScore,
  getTierFromRep,
  getDecayAmount,
} from '../src/utils/repEngine.js'

describe('repEngine', () => {
  it('HARD + rank 2 + 36h + 100% tests + rationale 88 + streak 0 → 795', () => {
    const total = calculateSubmissionRep({
      difficulty: 'HARD',
      rank: 2,
      submittedAt: new Date('2026-03-02T12:00:00Z'),
      opensAt: new Date('2026-03-01T00:00:00Z'),
      testScore: 100,
      rationaleScore: 88,
      streakDays: 0,
    })
    expect(total).toBe(795)
  })

  it('BEGINNER + rank 1 + 12h + 80% tests + rationale 92 → 194', () => {
    const total = calculateSubmissionRep({
      difficulty: 'BEGINNER',
      rank: 1,
      submittedAt: new Date('2026-03-01T12:00:00Z'),
      opensAt: new Date('2026-03-01T00:00:00Z'),
      testScore: 80,
      rationaleScore: 92,
      streakDays: 0,
    })
    expect(total).toBe(194)
  })

  it('LEGENDARY + rank 1 + 6h + 100% + rationale 95 → 2210', () => {
    const total = calculateSubmissionRep({
      difficulty: 'LEGENDARY',
      rank: 1,
      submittedAt: new Date('2026-03-01T06:00:00Z'),
      opensAt: new Date('2026-03-01T00:00:00Z'),
      testScore: 100,
      rationaleScore: 95,
      streakDays: 0,
    })
    expect(total).toBe(2210)
  })

  it('getTierFromRep boundaries', () => {
    expect(getTierFromRep(0)).toBe('NOVICE')
    expect(getTierFromRep(499)).toBe('NOVICE')
    expect(getTierFromRep(500)).toBe('APPRENTICE')
    expect(getTierFromRep(200000)).toBe('LEGEND')
  })

  it('getDecayAmount', () => {
    expect(getDecayAmount(10000, 2)).toBe(100)
  })

  it('calculateWeightedVoteScore uses neutral band when fewer than 5 votes', () => {
    const r = calculateWeightedVoteScore([
      { value: 'UP', voterRepAtTime: 2000 },
      { value: 'UP', voterRepAtTime: 100 },
    ])
    expect(r.voteScore).toBe(50)
    expect(r.upvoteCount).toBe(2)
  })

  it('calculateWeightedVoteScore weights high-rep upvotes more', () => {
    const lowOnly = calculateWeightedVoteScore([
      { value: 'UP', voterRepAtTime: 100 },
      { value: 'UP', voterRepAtTime: 200 },
      { value: 'DOWN', voterRepAtTime: 300 },
      { value: 'UP', voterRepAtTime: 400 },
      { value: 'DOWN', voterRepAtTime: 500 },
    ])
    const withHeavy = calculateWeightedVoteScore([
      { value: 'UP', voterRepAtTime: 100 },
      { value: 'UP', voterRepAtTime: 200 },
      { value: 'DOWN', voterRepAtTime: 300 },
      { value: 'UP', voterRepAtTime: 400 },
      { value: 'UP', voterRepAtTime: 5000 },
    ])
    expect(withHeavy.voteScore).toBeGreaterThan(lowOnly.voteScore)
  })
})
