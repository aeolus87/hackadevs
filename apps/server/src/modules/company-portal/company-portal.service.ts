import type { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'
import { createNotification } from '../notifications/notifications.service.js'
import type { RegisterPortalBody, SubmitChallengeBody } from './company-portal.schema.js'

async function getPortalByHeaders(
  prisma: PrismaClient,
  portalId: string | undefined,
  secret: string | undefined,
) {
  if (!portalId || !secret) return null
  const portal = await prisma.companyPortal.findFirst({
    where: { id: portalId, portalSecret: secret, deletedAt: null },
  })
  if (!portal) return null
  if (!portal.isApproved) {
    throw Object.assign(new Error('portal_not_approved'), { statusCode: 403 })
  }
  return portal
}

export function createCompanyPortalService(prisma: PrismaClient) {
  return {
    async registerPortal(body: RegisterPortalBody) {
      const portalSecret = nanoid(32)
      const portal = await prisma.companyPortal.create({
        data: {
          companyName: body.companyName,
          domainEmail: body.domainEmail.toLowerCase(),
          linkedinUrl: body.linkedinUrl ?? null,
          contactName: body.contactName,
          contactEmail: body.contactEmail.toLowerCase(),
          portalSecret,
          isApproved: false,
        },
      })
      return { portalId: portal.id, portalSecret, portal }
    },

    async submitChallenge(
      headers: Record<string, string | string[] | undefined>,
      body: SubmitChallengeBody,
    ) {
      const portalId =
        typeof headers['x-portal-id'] === 'string' ? headers['x-portal-id'] : undefined
      const sec =
        typeof headers['x-portal-secret'] === 'string' ? headers['x-portal-secret'] : undefined
      const portal = await getPortalByHeaders(prisma, portalId, sec)
      if (!portal) throw Object.assign(new Error('Invalid portal credentials'), { statusCode: 403 })
      return prisma.companyChallenge.create({
        data: {
          portalId: portal.id,
          rawProblem: body.rawProblem,
        },
      })
    },

    async listOwnChallenges(headers: Record<string, string | string[] | undefined>) {
      const portalId =
        typeof headers['x-portal-id'] === 'string' ? headers['x-portal-id'] : undefined
      const sec =
        typeof headers['x-portal-secret'] === 'string' ? headers['x-portal-secret'] : undefined
      const portal = await getPortalByHeaders(prisma, portalId, sec)
      if (!portal) throw Object.assign(new Error('Invalid portal credentials'), { statusCode: 403 })
      return prisma.companyChallenge.findMany({
        where: { portalId: portal.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      })
    },

    async bookmarkSolver(
      headers: Record<string, string | string[] | undefined>,
      submissionId: string,
    ) {
      const portalId =
        typeof headers['x-portal-id'] === 'string' ? headers['x-portal-id'] : undefined
      const sec =
        typeof headers['x-portal-secret'] === 'string' ? headers['x-portal-secret'] : undefined
      const portal = await getPortalByHeaders(prisma, portalId, sec)
      if (!portal) throw Object.assign(new Error('Invalid portal credentials'), { statusCode: 403 })
      const sub = await prisma.submission.findFirst({
        where: { id: submissionId, status: 'PUBLISHED', deletedAt: null },
      })
      if (!sub) throw Object.assign(new Error('not_found'), { statusCode: 404 })
      const bookmark = await prisma.companyBookmark.create({
        data: {
          portalId: portal.id,
          userId: sub.userId,
          submissionId: sub.id,
        },
      })
      await prisma.companyBookmark.update({
        where: { id: bookmark.id },
        data: { notifiedUser: true },
      })
      await createNotification(
        prisma,
        sub.userId,
        'COMPANY_BOOKMARKED',
        'A company bookmarked your solution',
        `${portal.companyName} saved your solution for future reference.`,
        { portalId: portal.id, submissionId: sub.id },
      )
      return { ok: true as const }
    },

    async listBookmarks(headers: Record<string, string | string[] | undefined>) {
      const portalId =
        typeof headers['x-portal-id'] === 'string' ? headers['x-portal-id'] : undefined
      const sec =
        typeof headers['x-portal-secret'] === 'string' ? headers['x-portal-secret'] : undefined
      const portal = await getPortalByHeaders(prisma, portalId, sec)
      if (!portal) throw Object.assign(new Error('Invalid portal credentials'), { statusCode: 403 })
      return prisma.companyBookmark.findMany({
        where: { portalId: portal.id, deletedAt: null },
        include: {
          submission: {
            include: {
              user: { select: { username: true, displayName: true } },
              challenge: { select: { title: true, slug: true } },
            },
          },
        },
      })
    },
  }
}
