import type { PrismaClient } from '@prisma/client'
import { calculateWeightedVoteScore } from '../utils/repEngine.js'
import { assignRanks, calculateCompositeScore } from '../utils/rankingEngine.js'
import { mulberry32, randInt, shuffleInPlace } from './rng.js'

const ADMIN_USERNAME = 'hackadevs_admin'

export async function seedFollows(prisma: PrismaClient) {
  const rng = mulberry32(0xdecafbad)
  const users = await prisma.user.findMany({
    where: { deletedAt: null, username: { not: ADMIN_USERNAME } },
    select: { id: true },
  })
  const ids = users.map((u) => u.id)
  if (ids.length < 2) return

  const cap = Math.min(520, Math.max(0, ids.length * (ids.length - 1)))
  const seen = new Set<string>()
  const rows: { followerId: string; followeeId: string }[] = []
  let guard = 0
  while (rows.length < cap && guard < cap * 40) {
    guard++
    const followerId = pickId(rng, ids)
    const followeeId = pickId(rng, ids)
    if (followerId === followeeId) continue
    const key = `${followerId}:${followeeId}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({ followerId, followeeId })
  }
  if (rows.length) {
    await prisma.follow.createMany({ data: rows, skipDuplicates: true })
  }
}

function pickId(rng: () => number, ids: string[]): string {
  return ids[Math.floor(rng() * ids.length)]!
}

export async function seedVotesAndRefreshRanks(
  prisma: PrismaClient,
  challengeSlugs: readonly string[],
) {
  const rng = mulberry32(0xbeefcafe)
  const challenges = await prisma.challenge.findMany({
    where: { slug: { in: [...challengeSlugs] }, deletedAt: null },
    select: { id: true, slug: true },
  })
  const chIds = new Set(challenges.map((c) => c.id))

  const submissions = await prisma.submission.findMany({
    where: {
      status: 'PUBLISHED',
      deletedAt: null,
      challengeId: { in: [...chIds] },
    },
    select: {
      id: true,
      userId: true,
      challengeId: true,
      testScore: true,
      rationaleScore: true,
    },
  })

  const users = await prisma.user.findMany({
    where: { deletedAt: null, isBanned: false },
    select: { id: true, totalRep: true },
  })
  const repById = new Map(users.map((u) => [u.id, u.totalRep]))

  const voteRows: {
    voterId: string
    submissionId: string
    value: 'UP' | 'DOWN'
    voterRepAtTime: number
  }[] = []

  for (const s of submissions) {
    const others = users.filter((u) => u.id !== s.userId).map((u) => u.id)
    shuffleInPlace(rng, others)
    const n = Math.min(randInt(rng, 7, 24), others.length)
    const voters = others.slice(0, n)
    for (const vid of voters) {
      voteRows.push({
        voterId: vid,
        submissionId: s.id,
        value: rng() < 0.78 ? 'UP' : 'DOWN',
        voterRepAtTime: repById.get(vid) ?? 0,
      })
    }
  }

  if (voteRows.length) {
    await prisma.vote.createMany({ data: voteRows, skipDuplicates: true })
  }

  for (const ch of challenges) {
    const subs = await prisma.submission.findMany({
      where: {
        challengeId: ch.id,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: {
        id: true,
        testScore: true,
        rationaleScore: true,
        submittedAt: true,
      },
    })
    for (const s of subs) {
      const votes = await prisma.vote.findMany({
        where: { submissionId: s.id, deletedAt: null },
        select: { value: true, voterRepAtTime: true },
      })
      const rows = votes.map((v) => ({
        value: v.value as 'UP' | 'DOWN',
        voterRepAtTime: v.voterRepAtTime,
      }))
      const { voteScore, upvoteCount, downvoteCount } = calculateWeightedVoteScore(rows)
      const comp = calculateCompositeScore(s.testScore ?? 0, s.rationaleScore ?? 0, voteScore)
      await prisma.submission.update({
        where: { id: s.id },
        data: {
          voteScore,
          upvoteCount,
          downvoteCount,
          compositeScore: comp,
        },
      })
    }

    const ranked = await prisma.submission.findMany({
      where: { challengeId: ch.id, status: 'PUBLISHED', deletedAt: null },
      select: {
        id: true,
        compositeScore: true,
        rationaleScore: true,
        submittedAt: true,
      },
    })
    const rankMap = assignRanks(
      ranked.map((r) => ({
        id: r.id,
        compositeScore: r.compositeScore ?? 0,
        rationaleScore: r.rationaleScore ?? 0,
        submittedAt: r.submittedAt ?? new Date(),
      })),
    )
    for (const r of ranked) {
      const fr = rankMap.get(r.id)
      if (fr != null) {
        await prisma.submission.update({
          where: { id: r.id },
          data: { preliminaryRank: fr, finalRank: fr },
        })
      }
    }
  }
}
