import { prisma } from '../lib/prisma.js'
import { shouldResetStreak, consumeStreakGrace } from '../utils/streakEngine.js'
import { createNotification } from '../modules/notifications/notifications.service.js'

export async function runStreakCheckerJob() {
  const now = new Date()
  if (now.getUTCDate() === 1) {
    await prisma.user.updateMany({
      where: { deletedAt: null },
      data: { streakGracesRemaining: 1 },
    })
  }
  const users = await prisma.user.findMany({
    where: { deletedAt: null, lastSubmissionDate: { not: null } },
  })
  for (const u of users) {
    if (!u.lastSubmissionDate) continue
    if (!shouldResetStreak(u.lastSubmissionDate, now)) continue
    if (u.currentStreakDays > 7 && u.streakGracesRemaining > 0) {
      const { newGraces } = consumeStreakGrace(u.streakGracesRemaining)
      await prisma.user.update({
        where: { id: u.id },
        data: { streakGracesRemaining: newGraces },
      })
      await createNotification(
        prisma,
        u.id,
        'STREAK',
        'Streak saved!',
        `We used your grace period to save your ${u.currentStreakDays}-day streak.`,
        {},
      )
      continue
    }
    const prev = u.currentStreakDays
    await prisma.user.update({
      where: { id: u.id },
      data: { currentStreakDays: 0 },
    })
    await createNotification(
      prisma,
      u.id,
      'STREAK',
      'Streak lost',
      `Your ${prev}-day streak ended. Start a new one today.`,
      {},
    )
  }
}
