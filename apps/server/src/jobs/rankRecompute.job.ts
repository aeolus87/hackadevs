import { prisma } from '../lib/prisma.js'
import { createLeaderboardService } from '../modules/leaderboard/leaderboard.service.js'

export async function runRankRecomputeJob() {
  const lb = createLeaderboardService(prisma)
  await lb.recomputeGlobalRanks()
}
