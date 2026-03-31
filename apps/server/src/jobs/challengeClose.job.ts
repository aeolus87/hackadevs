import { prisma } from '../lib/prisma.js'
import { closeChallenge } from '../modules/challenges/challenges.service.js'

export async function runChallengeCloseJob() {
  const now = new Date()
  const expired = await prisma.challenge.findMany({
    where: {
      status: 'ACTIVE',
      closesAt: { lte: now },
      deletedAt: null,
    },
    select: { id: true },
  })
  for (const c of expired) {
    await closeChallenge(prisma, c.id)
  }
}
