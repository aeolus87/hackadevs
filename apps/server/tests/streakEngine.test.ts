import { describe, it, expect } from 'vitest'
import { recordSubmissionStreak } from '../src/utils/streakEngine.js'

describe('streakEngine', () => {
  it('first submission sets streak to 1', () => {
    const r = recordSubmissionStreak({
      currentStreakDays: 0,
      longestStreakDays: 0,
      lastSubmissionDate: null,
      now: new Date('2026-03-31T12:00:00Z'),
      streakGracesRemaining: 1,
    })
    expect(r.current).toBe(1)
    expect(r.longest).toBe(1)
  })

  it('consecutive day increments streak', () => {
    const r = recordSubmissionStreak({
      currentStreakDays: 3,
      longestStreakDays: 3,
      lastSubmissionDate: new Date('2026-03-30T10:00:00Z'),
      now: new Date('2026-03-31T12:00:00Z'),
      streakGracesRemaining: 1,
    })
    expect(r.current).toBe(4)
    expect(r.longest).toBe(4)
  })
})
