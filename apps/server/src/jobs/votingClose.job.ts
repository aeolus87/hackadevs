import { prisma } from '../lib/prisma.js'
import { applyVoteBonuses } from '../modules/rep/rep.service.js'

export async function runVotingCloseJob() {
  const now = new Date()
  const challenges = await prisma.challenge.findMany({
    where: {
      votingSettled: false,
      status: { in: ['CLOSED', 'ARCHIVED'] },
      deletedAt: null,
    },
    select: { id: true, closesAt: true },
  })
  for (const ch of challenges) {
    const end = ch.closesAt.getTime() + 48 * 3600000
    if (now.getTime() >= end) {
      await applyVoteBonuses(prisma, ch.id)
    }
  }
}
