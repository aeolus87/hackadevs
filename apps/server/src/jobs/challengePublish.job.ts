import { runPublishScheduledChallenges } from '../modules/v1/v1.routes.js'
import { prisma } from '../lib/prisma.js'

export async function runChallengePublishJob() {
  await runPublishScheduledChallenges(prisma)
}
