import type { PrismaClient, RepEventType, Categories, ChallengeDifficulty } from '@prisma/client'
import {
  getTierFromRep,
  calculateSubmissionRep,
  getCommunityVoteBonus,
  getDecayAmount,
  BASE_REP,
  DIFFICULTY_MULTIPLIER,
  getTestMultiplier,
  getStreakBonus,
  getRankMultiplier,
  getSpeedBonus,
  getRationaleBonus,
  calculateWeightedVoteScore,
} from '../../utils/repEngine.js'
import {
  assignRanks,
  calculateCompositeScore,
  getVotePercentile,
} from '../../utils/rankingEngine.js'

export type AwardRepMeta = {
  submissionId?: string
  challengeId?: string
  category?: Categories
  note?: string
}

export async function awardRep(
  prisma: PrismaClient,
  userId: string,
  type: RepEventType,
  amount: number,
  meta: AwardRepMeta = {},
) {
  const touchWeekly =
    type !== 'DECAY' && type !== 'REVERSAL' && !(type === 'MANUAL_ADJUSTMENT' && amount < 0)
  const weeklyDelta =
    amount !== 0 && (touchWeekly || type === 'DECAY' || type === 'REVERSAL')
      ? { weeklyRepDelta: { increment: amount } }
      : {}
  await prisma.$transaction(async (tx) => {
    await tx.repEvent.create({
      data: {
        userId,
        type,
        amount,
        submissionId: meta.submissionId ?? null,
        challengeId: meta.challengeId ?? null,
        category: meta.category ?? null,
        note: meta.note ?? null,
      },
    })
    await tx.user.update({
      where: { id: userId },
      data: {
        totalRep: { increment: amount },
        ...weeklyDelta,
      },
    })
    if (meta.category && amount !== 0) {
      if (amount > 0) {
        await tx.categoryRep.upsert({
          where: { userId_category: { userId, category: meta.category } },
          create: { userId, category: meta.category, rep: amount },
          update: { rep: { increment: amount } },
        })
      } else {
        const row = await tx.categoryRep.findUnique({
          where: { userId_category: { userId, category: meta.category } },
        })
        if (row) {
          const next = Math.max(0, row.rep + amount)
          await tx.categoryRep.update({
            where: { userId_category: { userId, category: meta.category } },
            data: { rep: next },
          })
        }
      }
    }
    const u = await tx.user.findUnique({
      where: { id: userId },
      select: { totalRep: true },
    })
    if (u) {
      await tx.user.update({
        where: { id: userId },
        data: { tier: getTierFromRep(u.totalRep) },
      })
    }
  })
}

export async function revokeRep(
  prisma: PrismaClient,
  userId: string,
  submissionId: string,
  reason: string,
  category?: Categories,
) {
  const agg = await prisma.repEvent.aggregate({
    where: { userId, submissionId, amount: { gt: 0 } },
    _sum: { amount: true },
  })
  const sum = agg._sum.amount ?? 0
  if (sum <= 0) return
  await awardRep(prisma, userId, 'REVERSAL', -sum, { submissionId, note: reason, category })
}

export async function awardPreliminaryRep(
  prisma: PrismaClient,
  submissions: {
    id: string
    userId: string
    rank: number
    difficulty: ChallengeDifficulty
    submittedAt: Date
    testScore: number
    rationaleScore: number
  }[],
  challenge: { id: string; opensAt: Date; category: Categories },
  streakByUserId: Record<string, number>,
) {
  for (const s of submissions) {
    const streakDays = streakByUserId[s.userId] ?? 0
    const target = calculateSubmissionRep({
      difficulty: s.difficulty,
      rank: s.rank,
      submittedAt: s.submittedAt,
      opensAt: challenge.opensAt,
      testScore: s.testScore,
      rationaleScore: s.rationaleScore,
      streakDays,
    })
    const core =
      BASE_REP[s.difficulty] *
      DIFFICULTY_MULTIPLIER[s.difficulty] *
      getTestMultiplier(s.testScore) *
      (1 + getStreakBonus(streakDays))
    const step1 = Math.round(core * getRankMultiplier(s.rank))
    const step2 = Math.round(
      core * getRankMultiplier(s.rank) * getSpeedBonus(s.submittedAt, challenge.opensAt),
    )
    const subBase = Math.round(core)
    const rankPart = step1 - subBase
    const speedPart = step2 - step1
    const ratPart = getRationaleBonus(s.rationaleScore)
    const adjust = target - (subBase + rankPart + speedPart + ratPart)
    await awardRep(prisma, s.userId, 'SUBMISSION_BASE', subBase, {
      submissionId: s.id,
      challengeId: challenge.id,
      category: challenge.category,
    })
    await awardRep(prisma, s.userId, 'RANK_MULTIPLIER', rankPart, {
      submissionId: s.id,
      challengeId: challenge.id,
      category: challenge.category,
    })
    await awardRep(prisma, s.userId, 'SPEED_BONUS', speedPart, {
      submissionId: s.id,
      challengeId: challenge.id,
      category: challenge.category,
    })
    await awardRep(prisma, s.userId, 'RATIONALE_BONUS', ratPart, {
      submissionId: s.id,
      challengeId: challenge.id,
      category: challenge.category,
    })
    if (adjust !== 0) {
      await awardRep(prisma, s.userId, 'MANUAL_ADJUSTMENT', adjust, {
        submissionId: s.id,
        challengeId: challenge.id,
        category: challenge.category,
        note: 'preliminary_rep_align',
      })
    }
    await prisma.submission.update({
      where: { id: s.id },
      data: { repAwarded: target },
    })
  }
}

export async function applyVoteBonuses(prisma: PrismaClient, challengeId: string) {
  const ch = await prisma.challenge.findFirst({
    where: { id: challengeId, deletedAt: null },
  })
  if (!ch || ch.votingSettled) return
  let subs = await prisma.submission.findMany({
    where: {
      challengeId,
      status: 'PUBLISHED',
      deletedAt: null,
    },
  })
  if (subs.length === 0) {
    await prisma.challenge.update({
      where: { id: challengeId },
      data: { votingSettled: true },
    })
    return
  }
  for (const s of subs) {
    const voteRows = await prisma.vote.findMany({
      where: { submissionId: s.id, deletedAt: null },
      select: { value: true, voterRepAtTime: true },
    })
    const { voteScore, upvoteCount, downvoteCount } = calculateWeightedVoteScore(voteRows)
    await prisma.submission.update({
      where: { id: s.id },
      data: { upvoteCount, downvoteCount, voteScore },
    })
  }
  subs = await prisma.submission.findMany({
    where: { challengeId, status: 'PUBLISHED', deletedAt: null },
  })
  for (const s of subs) {
    const vs = s.voteScore ?? 50
    const comp = calculateCompositeScore(s.testScore ?? 0, s.rationaleScore ?? 0, vs)
    await prisma.submission.update({
      where: { id: s.id },
      data: { compositeScore: comp },
    })
  }
  subs = await prisma.submission.findMany({
    where: { challengeId, status: 'PUBLISHED', deletedAt: null },
  })
  const ranked = subs.map((s) => ({
    id: s.id,
    compositeScore: calculateCompositeScore(
      s.testScore ?? 0,
      s.rationaleScore ?? 0,
      s.voteScore ?? 50,
    ),
    rationaleScore: s.rationaleScore ?? 0,
    submittedAt: s.submittedAt ?? s.createdAt,
  }))
  const rankMap = assignRanks(ranked)
  for (const s of subs) {
    const fr = rankMap.get(s.id)
    if (fr != null) {
      await prisma.submission.update({
        where: { id: s.id },
        data: { finalRank: fr },
      })
    }
  }
  subs = await prisma.submission.findMany({
    where: { challengeId, status: 'PUBLISHED', deletedAt: null },
  })
  const voteScoresArr = subs.map((s) => s.voteScore ?? 50)
  for (const s of subs) {
    const vs = s.voteScore ?? 50
    const pct = getVotePercentile(vs, voteScoresArr)
    const bonus = getCommunityVoteBonus(pct)
    if (bonus > 0) {
      await awardRep(prisma, s.userId, 'VOTE_BONUS', bonus, {
        submissionId: s.id,
        challengeId,
        category: ch.category,
        note: `vote_percentile_${pct.toFixed(0)}`,
      })
    }
  }
  await prisma.challenge.update({
    where: { id: challengeId },
    data: { votingSettled: true },
  })
}

export async function runWeeklyDecay(prisma: PrismaClient) {
  const cutoff = new Date(Date.now() - 90 * 86400000)
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      isBanned: false,
      lastSubmissionDate: { lt: cutoff },
    },
  })
  const now = new Date()
  for (const u of users) {
    if (!u.lastSubmissionDate) continue
    const ms = now.getTime() - u.lastSubmissionDate.getTime()
    const weeksInactive = Math.max(1, Math.floor(ms / (7 * 86400000)))
    const decayAmount = getDecayAmount(u.totalRep, weeksInactive)
    if (decayAmount <= 0) continue
    await awardRep(prisma, u.id, 'DECAY', -decayAmount, {
      note: `inactive_${weeksInactive}w`,
    })
  }
}
