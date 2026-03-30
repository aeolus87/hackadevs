export type StreakInput = {
  currentStreakDays: number
  longestStreakDays: number
  lastSubmissionDate: Date | null
  now: Date
  streakGracesRemaining: number
}

export type StreakTickResult = {
  nextCurrent: number
  nextLongest: number
  gracesRemaining: number
  missedDay: boolean
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function diffUtcDays(a: Date, b: Date): number {
  const sa = startOfUtcDay(a).getTime()
  const sb = startOfUtcDay(b).getTime()
  return Math.round((sa - sb) / 86400000)
}

export function recordSubmissionStreak(input: StreakInput): {
  current: number
  longest: number
  gracesRemaining: number
} {
  const today = startOfUtcDay(input.now)
  if (!input.lastSubmissionDate) {
    return {
      current: 1,
      longest: Math.max(1, input.longestStreakDays),
      gracesRemaining: input.streakGracesRemaining,
    }
  }
  const last = startOfUtcDay(input.lastSubmissionDate)
  const gap = diffUtcDays(today, last)
  if (gap === 0) {
    return {
      current: input.currentStreakDays,
      longest: input.longestStreakDays,
      gracesRemaining: input.streakGracesRemaining,
    }
  }
  if (gap === 1) {
    const next = input.currentStreakDays + 1
    return {
      current: next,
      longest: Math.max(input.longestStreakDays, next),
      gracesRemaining: input.streakGracesRemaining,
    }
  }
  if (gap === 2 && input.streakGracesRemaining > 0) {
    const next = input.currentStreakDays + 1
    return {
      current: next,
      longest: Math.max(input.longestStreakDays, next),
      gracesRemaining: input.streakGracesRemaining - 1,
    }
  }
  return {
    current: 1,
    longest: input.longestStreakDays,
    gracesRemaining: input.streakGracesRemaining,
  }
}

export function dailyStreakCheck(input: StreakInput): StreakTickResult {
  const today = startOfUtcDay(input.now)
  if (!input.lastSubmissionDate) {
    return {
      nextCurrent: 0,
      nextLongest: input.longestStreakDays,
      gracesRemaining: input.streakGracesRemaining,
      missedDay: diffUtcDays(today, today) > 1,
    }
  }
  const last = startOfUtcDay(input.lastSubmissionDate)
  const gap = diffUtcDays(today, last)
  if (gap <= 1) {
    return {
      nextCurrent: input.currentStreakDays,
      nextLongest: input.longestStreakDays,
      gracesRemaining: input.streakGracesRemaining,
      missedDay: false,
    }
  }
  if (gap === 2 && input.streakGracesRemaining > 0) {
    return {
      nextCurrent: input.currentStreakDays,
      nextLongest: input.longestStreakDays,
      gracesRemaining: input.streakGracesRemaining - 1,
      missedDay: true,
    }
  }
  return {
    nextCurrent: 0,
    nextLongest: input.longestStreakDays,
    gracesRemaining: input.streakGracesRemaining,
    missedDay: true,
  }
}
