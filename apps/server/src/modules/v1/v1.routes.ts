import type { FastifyPluginAsync } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import type { ServerEnv } from '@hackadevs/config'
import { prisma } from '../../lib/prisma.js'
import { createAuthRoutes } from '../auth/auth.routes.js'
import { requireAuth, optionalAuth } from '../../plugins/auth-context.js'
import { requireAdmin } from '../../plugins/require-admin.js'
import { sendError, sendPaginated, sendSuccess } from '../../utils/api-response.js'
import {
  createChallengeSchema,
  listChallengesSchema,
  updateChallengeSchema,
} from '../challenges/challenges.schema.js'
import {
  createChallenge,
  getChallengeBySlug,
  getChallengeLeaderboard,
  listActiveChallenges,
  listChallenges,
  publishChallenge,
  softDeleteChallenge,
  updateChallenge,
} from '../challenges/challenges.service.js'
import { createSubmissionsService } from '../submissions/submissions.service.js'
import { completeFollowUpSchema, saveDraftSchema } from '../submissions/submissions.schema.js'
import { createVotesService } from '../votes/votes.service.js'
import { castVoteSchema } from '../votes/votes.schema.js'
import { createLeaderboardService } from '../leaderboard/leaderboard.service.js'
import { createFollowsService } from '../follows/follows.service.js'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../notifications/notifications.service.js'
import { createUsersService } from '../users/users.service.js'
import { toUserPublic } from '../auth/user-public.js'
import { patchMeSchema } from '../users/users.schema.js'
import { generateChallengeSchema, moderationPatchSchema } from '../admin/admin.schema.js'
import { createAdminService } from '../admin/admin.service.js'
import { createAdminChallengeRoutes } from '../admin/admin.routes.js'
import { githubOauthPlugin } from '../../integrations/github-oauth.js'
import { createCompanyPortalService } from '../company-portal/company-portal.service.js'
import {
  registerPortalSchema,
  submitChallengeSchema,
} from '../company-portal/company-portal.schema.js'
import type { Categories } from '@prisma/client'
import { globalSearchQuerySchema } from '../search/search.schema.js'
import { searchGlobal } from '../search/search.service.js'

function handleErr(reply: import('fastify').FastifyReply, err: unknown) {
  const e = err as { statusCode?: number; message?: string }
  const status = typeof e.statusCode === 'number' ? e.statusCode : 500
  const message = e.message ?? 'Internal error'
  return sendError(reply, status, message)
}

export type V1RouteOpts = {
  jwtSecret: string
  env: ServerEnv
}

export const createV1Routes = (opts: V1RouteOpts): FastifyPluginAsync => {
  const { jwtSecret, env } = opts
  const authMw = requireAuth(jwtSecret)
  const adminMw = [authMw, requireAdmin(prisma, jwtSecret)]
  const optAuth = optionalAuth(jwtSecret)

  const submissionsApi = createSubmissionsService(prisma, {
    judge0Url: env.JUDGE0_API_URL,
    judge0Key: env.JUDGE0_API_KEY,
  })

  const votesApi = createVotesService(prisma)
  const leaderboardApi = createLeaderboardService(prisma)
  const followsApi = createFollowsService(prisma)
  const usersApi = createUsersService(prisma)
  const adminApi = createAdminService(prisma)
  const portalApi = createCompanyPortalService(prisma)

  return async (f) => {
    await f.register(rateLimit, {
      max: 200,
      timeWindow: '1 minute',
    })

    await f.register(githubOauthPlugin, { prisma, jwtSecret, env })

    await f.register(createAdminChallengeRoutes({ jwtSecret }))

    await f.register(createAuthRoutes(prisma, jwtSecret), { prefix: '/auth' })

    f.get('/search', async (req, reply) => {
      const parsed = globalSearchQuerySchema.safeParse(req.query)
      if (!parsed.success) {
        return sendError(reply, 400, 'Invalid query')
      }
      try {
        const data = await searchGlobal(prisma, parsed.data)
        return sendSuccess(reply, data)
      } catch (e) {
        return handleErr(reply, e)
      }
    })

    f.get('/challenges', async (req, reply) => {
      const parsed = listChallengesSchema.safeParse(req.query)
      if (!parsed.success) {
        return sendError(reply, 400, 'Invalid query')
      }
      try {
        const r = await listChallenges(prisma, parsed.data)
        return sendPaginated(reply, r.items, r.total, r.page, r.limit)
      } catch (e) {
        return handleErr(reply, e)
      }
    })

    f.get('/challenges/active', async (_req, reply) => {
      const items = await listActiveChallenges(prisma)
      return sendSuccess(reply, items)
    })

    f.get<{ Params: { slug: string } }>('/challenges/:slug/leaderboard', async (req, reply) => {
      const page = Math.max(1, Number((req.query as { page?: string }).page) || 1)
      const limit = Math.min(50, Math.max(1, Number((req.query as { limit?: string }).limit) || 20))
      const r = await getChallengeLeaderboard(prisma, req.params.slug, page, limit)
      if (!r) return sendError(reply, 404, 'Not found')
      return sendPaginated(reply, r.items, r.total, r.page, r.limit)
    })

    f.get<{ Params: { slug: string } }>('/challenges/:slug', async (req, reply) => {
      const ch = await getChallengeBySlug(prisma, req.params.slug, false)
      if (!ch) return sendError(reply, 404, 'Not found')
      return sendSuccess(reply, ch)
    })

    f.post('/challenges', { preHandler: adminMw }, async (req, reply) => {
      const parsed = createChallengeSchema.safeParse(req.body)
      if (!parsed.success) return sendError(reply, 400, 'Invalid body')
      try {
        const uid = req.jwtUser!.sub
        const ch = await createChallenge(prisma, parsed.data, uid)
        return sendSuccess(reply, ch, undefined, 201)
      } catch (e) {
        return handleErr(reply, e)
      }
    })

    f.patch<{ Params: { id: string } }>(
      '/challenges/:id',
      { preHandler: adminMw },
      async (req, reply) => {
        const parsed = updateChallengeSchema.safeParse(req.body)
        if (!parsed.success) return sendError(reply, 400, 'Invalid body')
        try {
          const ch = await updateChallenge(prisma, req.params.id, parsed.data)
          return sendSuccess(reply, ch)
        } catch {
          return sendError(reply, 404, 'Not found')
        }
      },
    )

    f.delete<{ Params: { id: string } }>(
      '/challenges/:id',
      { preHandler: adminMw },
      async (req, reply) => {
        try {
          await softDeleteChallenge(prisma, req.params.id)
          return sendSuccess(reply, { ok: true })
        } catch {
          return sendError(reply, 404, 'Not found')
        }
      },
    )

    f.post<{ Params: { id: string } }>(
      '/challenges/:id/publish',
      { preHandler: adminMw },
      async (req, reply) => {
        const ch = await publishChallenge(prisma, req.params.id)
        if (!ch) return sendError(reply, 404, 'Not found')
        return sendSuccess(reply, ch)
      },
    )

    f.patch('/users/me', { preHandler: authMw }, async (req, reply) => {
      const parsed = patchMeSchema.safeParse(req.body)
      if (!parsed.success) return sendError(reply, 400, 'Invalid body')
      const u = await usersApi.patchMe(req.jwtUser!.sub, parsed.data)
      return sendSuccess(reply, toUserPublic(u))
    })

    f.get('/users/me', { preHandler: authMw }, async (req, reply) => {
      const u = await usersApi.getMe(req.jwtUser!.sub)
      if (!u) return sendError(reply, 404, 'Not found')
      return sendSuccess(reply, toUserPublic(u))
    })

    f.get('/users/me/activity', { preHandler: authMw }, async (req, reply) => {
      const page = Math.max(1, Number((req.query as { page?: string }).page) || 1)
      const limit = Math.min(50, Math.max(1, Number((req.query as { limit?: string }).limit) || 20))
      const r = await usersApi.getActivityFeed(req.jwtUser!.sub, page, limit)
      return sendPaginated(reply, r.items, r.total, r.page, r.limit)
    })

    f.post<{ Params: { submissionId: string } }>(
      '/users/me/pin/:submissionId',
      { preHandler: authMw },
      async (req, reply) => {
        try {
          await usersApi.pinSubmission(req.jwtUser!.sub, req.params.submissionId)
          return sendSuccess(reply, { ok: true })
        } catch (e) {
          return handleErr(reply, e)
        }
      },
    )

    f.delete<{ Params: { submissionId: string } }>(
      '/users/me/pin/:submissionId',
      { preHandler: authMw },
      async (req, reply) => {
        await usersApi.unpinSubmission(req.jwtUser!.sub, req.params.submissionId)
        return sendSuccess(reply, { ok: true })
      },
    )

    f.get<{ Params: { username: string } }>('/users/:username/followers', async (req, reply) => {
      const page = Math.max(1, Number((req.query as { page?: string }).page) || 1)
      const limit = Math.min(50, Math.max(1, Number((req.query as { limit?: string }).limit) || 20))
      const r = await followsApi.getFollowers(req.params.username, page, limit)
      if (!r) return sendError(reply, 404, 'Not found')
      return sendPaginated(reply, r.items, r.total, r.page, r.limit)
    })

    f.get<{ Params: { username: string } }>('/users/:username/following', async (req, reply) => {
      const page = Math.max(1, Number((req.query as { page?: string }).page) || 1)
      const limit = Math.min(50, Math.max(1, Number((req.query as { limit?: string }).limit) || 20))
      const r = await followsApi.getFollowing(req.params.username, page, limit)
      if (!r) return sendError(reply, 404, 'Not found')
      return sendPaginated(reply, r.items, r.total, r.page, r.limit)
    })

    f.get<{ Params: { username: string } }>('/users/:username/solutions', async (req, reply) => {
      const page = Math.max(1, Number((req.query as { page?: string }).page) || 1)
      const limit = Math.min(50, Math.max(1, Number((req.query as { limit?: string }).limit) || 20))
      const r = await usersApi.getSolutionsByUsername(req.params.username, page, limit)
      if (!r) return sendError(reply, 404, 'Not found')
      return sendPaginated(reply, r.items, r.total, r.page, r.limit)
    })

    f.get<{ Params: { username: string } }>('/users/:username/activity', async (req, reply) => {
      const page = Math.max(1, Number((req.query as { page?: string }).page) || 1)
      const limit = Math.min(50, Math.max(1, Number((req.query as { limit?: string }).limit) || 20))
      const r = await usersApi.getActivityFeedByUsername(req.params.username, page, limit)
      if (!r) return sendError(reply, 404, 'Not found')
      return sendPaginated(reply, r.items, r.total, r.page, r.limit)
    })

    f.get<{ Params: { username: string } }>(
      '/users/:username',
      { preHandler: [optAuth] },
      async (req, reply) => {
        const viewerId = req.jwtUser?.sub ?? null
        const p = await usersApi.getPublicProfile(req.params.username, viewerId)
        if (!p) return sendError(reply, 404, 'Not found')
        return sendSuccess(reply, p)
      },
    )

    f.post('/submissions', { preHandler: authMw }, async (req, reply) => {
      const parsed = saveDraftSchema.safeParse(req.body)
      if (!parsed.success) return sendError(reply, 400, 'Invalid body')
      try {
        const sub = await submissionsApi.saveDraft(req.jwtUser!.sub, parsed.data)
        return sendSuccess(reply, sub, undefined, 201)
      } catch (e) {
        return handleErr(reply, e)
      }
    })

    f.post<{ Params: { id: string } }>(
      '/submissions/:id/run',
      { preHandler: authMw },
      async (req, reply) => {
        try {
          const r = await submissionsApi.runTests(req.params.id, req.jwtUser!.sub)
          return sendSuccess(reply, r)
        } catch (e) {
          return handleErr(reply, e)
        }
      },
    )

    f.post<{ Params: { id: string } }>(
      '/submissions/:id/submit',
      { preHandler: authMw },
      async (req, reply) => {
        try {
          const r = await submissionsApi.submitSolution(req.params.id, req.jwtUser!.sub)
          return sendSuccess(reply, r)
        } catch (e) {
          return handleErr(reply, e)
        }
      },
    )

    f.post<{ Params: { id: string } }>(
      '/submissions/:id/resume-followup',
      { preHandler: authMw },
      async (req, reply) => {
        try {
          const r = await submissionsApi.resumeFlaggedToFollowUp(req.params.id, req.jwtUser!.sub)
          return sendSuccess(reply, r)
        } catch (e) {
          return handleErr(reply, e)
        }
      },
    )

    f.post<{ Params: { id: string } }>(
      '/submissions/:id/withdraw-for-revision',
      { preHandler: authMw },
      async (req, reply) => {
        try {
          const sub = await submissionsApi.withdrawPublishedForRevision(
            req.params.id,
            req.jwtUser!.sub,
          )
          return sendSuccess(reply, sub)
        } catch (e) {
          return handleErr(reply, e)
        }
      },
    )

    f.post<{ Params: { id: string } }>(
      '/submissions/:id/follow-up',
      { preHandler: authMw },
      async (req, reply) => {
        const parsed = completeFollowUpSchema.safeParse(req.body)
        if (!parsed.success) return sendError(reply, 400, 'Invalid body')
        try {
          const r = await submissionsApi.completeFollowUp(
            req.params.id,
            req.jwtUser!.sub,
            parsed.data,
          )
          return sendSuccess(reply, r)
        } catch (e) {
          return handleErr(reply, e)
        }
      },
    )

    f.get<{ Params: { challengeId: string } }>(
      '/submissions/challenge/:challengeId',
      async (req, reply) => {
        const page = Math.max(1, Number((req.query as { page?: string }).page) || 1)
        const limit = Math.min(
          50,
          Math.max(1, Number((req.query as { limit?: string }).limit) || 20),
        )
        const r = await submissionsApi.getSubmissionsByChallenge(
          req.params.challengeId,
          page,
          limit,
        )
        return sendPaginated(reply, r.items, r.total, r.page, r.limit)
      },
    )

    f.get<{ Params: { challengeId: string } }>(
      '/submissions/mine/challenge/:challengeId',
      { preHandler: authMw },
      async (req, reply) => {
        const sub = await submissionsApi.getOwnSubmission(req.jwtUser!.sub, req.params.challengeId)
        return sendSuccess(reply, sub)
      },
    )

    f.get<{ Params: { id: string } }>(
      '/submissions/:id',
      { preHandler: [optAuth] },
      async (req, reply) => {
        const uid = req.jwtUser?.sub ?? null
        const sub = await submissionsApi.getSubmission(req.params.id, uid)
        if (!sub) return sendError(reply, 404, 'Not found')
        return sendSuccess(reply, sub)
      },
    )

    f.delete<{ Params: { id: string } }>(
      '/submissions/:id',
      { preHandler: authMw },
      async (req, reply) => {
        try {
          await submissionsApi.softDeleteDraft(req.params.id, req.jwtUser!.sub)
          return sendSuccess(reply, { ok: true })
        } catch (e) {
          return handleErr(reply, e)
        }
      },
    )

    f.post('/votes', { preHandler: authMw }, async (req, reply) => {
      const parsed = castVoteSchema.safeParse(req.body)
      if (!parsed.success) return sendError(reply, 400, 'Invalid body')
      try {
        await votesApi.castVote(req.jwtUser!.sub, parsed.data)
        return sendSuccess(reply, { ok: true })
      } catch (e) {
        return handleErr(reply, e)
      }
    })

    f.delete<{ Params: { submissionId: string } }>(
      '/votes/:submissionId',
      { preHandler: authMw },
      async (req, reply) => {
        try {
          await votesApi.retractVote(req.jwtUser!.sub, req.params.submissionId)
          return sendSuccess(reply, { ok: true })
        } catch (e) {
          return handleErr(reply, e)
        }
      },
    )

    f.get<{ Params: { submissionId: string } }>(
      '/votes/submission/:submissionId',
      { preHandler: [optAuth] },
      async (req, reply) => {
        const uid = req.jwtUser?.sub ?? null
        const r = await votesApi.getVoteCounts(req.params.submissionId, uid)
        if (!r) return sendError(reply, 404, 'Not found')
        return sendSuccess(reply, {
          upvoteCount: r.upvoteCount,
          downvoteCount: r.downvoteCount,
          userVote: r.userVote,
        })
      },
    )

    f.get('/leaderboard/global', async (req, reply) => {
      const page = Math.max(1, Number((req.query as { page?: string }).page) || 1)
      const limit = Math.min(50, Math.max(1, Number((req.query as { limit?: string }).limit) || 20))
      const r = await leaderboardApi.getGlobalLeaderboard(page, limit)
      return sendPaginated(reply, r.items, r.total, r.page, r.limit)
    })

    f.get<{ Params: { category: string } }>(
      '/leaderboard/category/:category',
      async (req, reply) => {
        const cat = req.params.category.toUpperCase() as Categories
        const page = Math.max(1, Number((req.query as { page?: string }).page) || 1)
        const limit = Math.min(
          50,
          Math.max(1, Number((req.query as { limit?: string }).limit) || 20),
        )
        try {
          const r = await leaderboardApi.getCategoryLeaderboard(cat, page, limit)
          return sendPaginated(reply, r.items, r.total, r.page, r.limit)
        } catch {
          return sendError(reply, 400, 'Invalid category')
        }
      },
    )

    f.get('/leaderboard/friends', { preHandler: authMw }, async (req, reply) => {
      const items = await leaderboardApi.getFriendsLeaderboard(req.jwtUser!.sub)
      return sendSuccess(reply, items)
    })

    f.get('/leaderboard/me/rank', { preHandler: authMw }, async (req, reply) => {
      const r = await leaderboardApi.getMyRank(req.jwtUser!.sub)
      if (!r) return sendError(reply, 404, 'Not found')
      return sendSuccess(reply, r)
    })

    f.post<{ Params: { username: string } }>(
      '/follows/:username',
      { preHandler: authMw },
      async (req, reply) => {
        try {
          await followsApi.follow(req.jwtUser!.sub, req.params.username)
          return sendSuccess(reply, { ok: true })
        } catch (e) {
          return handleErr(reply, e)
        }
      },
    )

    f.delete<{ Params: { username: string } }>(
      '/follows/:username',
      { preHandler: authMw },
      async (req, reply) => {
        await followsApi.unfollow(req.jwtUser!.sub, req.params.username)
        return sendSuccess(reply, { ok: true })
      },
    )

    f.get('/notifications', { preHandler: authMw }, async (req, reply) => {
      const page = Math.max(1, Number((req.query as { page?: string }).page) || 1)
      const limit = Math.min(50, Math.max(1, Number((req.query as { limit?: string }).limit) || 20))
      const r = await listNotifications(prisma, req.jwtUser!.sub, page, limit)
      return sendPaginated(reply, r.items, r.total, page, limit)
    })

    f.patch<{ Params: { id: string } }>(
      '/notifications/:id/read',
      { preHandler: authMw },
      async (req, reply) => {
        await markNotificationRead(prisma, req.jwtUser!.sub, req.params.id)
        return sendSuccess(reply, { ok: true })
      },
    )

    f.patch('/notifications/read-all', { preHandler: authMw }, async (req, reply) => {
      await markAllNotificationsRead(prisma, req.jwtUser!.sub)
      return sendSuccess(reply, { ok: true })
    })

    f.get('/admin/moderation-queue', { preHandler: adminMw }, async (req, reply) => {
      const page = Math.max(1, Number((req.query as { page?: string }).page) || 1)
      const limit = Math.min(50, Math.max(1, Number((req.query as { limit?: string }).limit) || 20))
      const r = await adminApi.listModerationQueue(page, limit)
      return sendPaginated(reply, r.items, r.total, r.page, r.limit)
    })

    f.patch<{ Params: { id: string } }>(
      '/admin/moderation/:id',
      { preHandler: adminMw },
      async (req, reply) => {
        const parsed = moderationPatchSchema.safeParse(req.body)
        if (!parsed.success) return sendError(reply, 400, 'Invalid body')
        try {
          await adminApi.applyModeration(req.params.id, req.jwtUser!.sub, parsed.data)
          return sendSuccess(reply, { ok: true })
        } catch (e) {
          return handleErr(reply, e)
        }
      },
    )

    f.post('/admin/challenges/generate', { preHandler: adminMw }, async (req, reply) => {
      const parsed = generateChallengeSchema.safeParse(req.body)
      if (!parsed.success) return sendError(reply, 400, 'Invalid body')
      try {
        const ch = await adminApi.generateDraftChallenge(parsed.data, req.jwtUser!.sub)
        return sendSuccess(reply, ch, undefined, 201)
      } catch (e) {
        return handleErr(reply, e)
      }
    })

    f.get('/admin/users', { preHandler: adminMw }, async (req, reply) => {
      const page = Math.max(1, Number((req.query as { page?: string }).page) || 1)
      const limit = Math.min(50, Math.max(1, Number((req.query as { limit?: string }).limit) || 20))
      const skip = (page - 1) * limit
      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where: { deletedAt: null },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            role: true,
            isBanned: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where: { deletedAt: null } }),
      ])
      return sendPaginated(reply, items, total, page, limit)
    })

    f.patch<{ Params: { id: string } }>(
      '/admin/users/:id/ban',
      { preHandler: adminMw },
      async (req, reply) => {
        const reason =
          typeof (req.body as { reason?: string })?.reason === 'string'
            ? (req.body as { reason: string }).reason
            : 'banned'
        await prisma.user.update({
          where: { id: req.params.id },
          data: { isBanned: true, banReason: reason },
        })
        return sendSuccess(reply, { ok: true })
      },
    )

    f.patch<{ Params: { id: string } }>(
      '/admin/users/:id/unban',
      { preHandler: adminMw },
      async (req, reply) => {
        await prisma.user.update({
          where: { id: req.params.id },
          data: { isBanned: false, banReason: null },
        })
        return sendSuccess(reply, { ok: true })
      },
    )

    f.get<{ Params: { userId: string } }>(
      '/admin/rep-events/:userId',
      { preHandler: adminMw },
      async (req, reply) => {
        const items = await adminApi.listRepEvents(req.params.userId)
        return sendSuccess(reply, items)
      },
    )

    f.get('/admin/analytics', { preHandler: adminMw }, async (_req, reply) => {
      const data = await adminApi.analytics()
      return sendSuccess(reply, data)
    })

    f.post<{ Params: { id: string } }>(
      '/admin/portals/:id/approve',
      { preHandler: adminMw },
      async (req, reply) => {
        try {
          const row = await adminApi.approveCompanyPortal(req.params.id)
          return sendSuccess(reply, row)
        } catch (e) {
          return handleErr(reply, e)
        }
      },
    )

    f.post('/portal/register', async (req, reply) => {
      const parsed = registerPortalSchema.safeParse(req.body)
      if (!parsed.success) return sendError(reply, 400, 'Invalid body')
      const r = await portalApi.registerPortal(parsed.data)
      return sendSuccess(
        reply,
        { portalId: r.portalId, portalSecret: r.portalSecret, portal: r.portal },
        undefined,
        201,
      )
    })

    f.post('/portal/challenges', async (req, reply) => {
      const parsed = submitChallengeSchema.safeParse(req.body)
      if (!parsed.success) return sendError(reply, 400, 'Invalid body')
      try {
        const row = await portalApi.submitChallenge(req.headers as never, parsed.data)
        return sendSuccess(reply, row, undefined, 201)
      } catch (e) {
        return handleErr(reply, e)
      }
    })

    f.get('/portal/challenges', async (req, reply) => {
      try {
        const rows = await portalApi.listOwnChallenges(req.headers as never)
        return sendSuccess(reply, rows)
      } catch (e) {
        return handleErr(reply, e)
      }
    })

    f.post<{ Params: { submissionId: string } }>(
      '/portal/bookmark/:submissionId',
      async (req, reply) => {
        try {
          await portalApi.bookmarkSolver(req.headers as never, req.params.submissionId)
          return sendSuccess(reply, { ok: true })
        } catch (e) {
          return handleErr(reply, e)
        }
      },
    )

    f.get('/portal/bookmarks', async (req, reply) => {
      try {
        const rows = await portalApi.listBookmarks(req.headers as never)
        return sendSuccess(reply, rows)
      } catch (e) {
        return handleErr(reply, e)
      }
    })
  }
}

export async function runPublishScheduledChallenges(prismaClient: typeof prisma) {
  const now = new Date()
  await prismaClient.challenge.updateMany({
    where: { status: 'SCHEDULED', opensAt: { lte: now }, deletedAt: null },
    data: { status: 'ACTIVE' },
  })
}
