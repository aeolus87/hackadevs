import { prisma } from '../lib/prisma.js'
import { runWeeklyDecay } from '../modules/rep/rep.service.js'

export async function runRepDecayJob() {
  await runWeeklyDecay(prisma)
  await prisma.user.updateMany({
    where: { deletedAt: null },
    data: { weeklyRepDelta: 0 },
  })
}
