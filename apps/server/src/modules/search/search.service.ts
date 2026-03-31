import type { PrismaClient } from '@prisma/client'
import type { Categories } from '@prisma/client'
import type { GlobalSearchQuery } from './search.schema.js'

export type SearchChallengeHit = {
  slug: string
  title: string
  category: Categories
}

export type SearchUserHit = {
  username: string
  displayName: string
  avatarUrl: string | null
}

export type GlobalSearchResult = {
  challenges: SearchChallengeHit[]
  users: SearchUserHit[]
}

export async function searchGlobal(
  prisma: PrismaClient,
  params: GlobalSearchQuery,
): Promise<GlobalSearchResult> {
  const q = params.q.trim()
  const qc = q.toLowerCase()
  const limitChallenges = params.limitChallenges
  const limitUsers = params.limitUsers

  const challengeWhere = {
    deletedAt: null,
    OR: [
      { title: { contains: q, mode: 'insensitive' as const } },
      { slug: { contains: q, mode: 'insensitive' as const } },
      { tags: { has: q } },
      { tags: { has: qc } },
    ],
  }

  const [challengeRows, userRows] = await Promise.all([
    prisma.challenge.findMany({
      where: challengeWhere,
      select: { slug: true, title: true, category: true },
      orderBy: { opensAt: 'desc' },
      take: limitChallenges,
    }),
    prisma.user.findMany({
      where: {
        deletedAt: null,
        isBanned: false,
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { displayName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { username: true, displayName: true, avatarUrl: true },
      orderBy: { username: 'asc' },
      take: limitUsers,
    }),
  ])

  return {
    challenges: challengeRows.map((c) => ({
      slug: c.slug,
      title: c.title,
      category: c.category,
    })),
    users: userRows.map((u) => ({
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
    })),
  }
}
