import type { FastifyPluginAsync } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { prisma } from '../../lib/prisma.js'
import { createAuthRoutes } from '../auth/auth.routes.js'
import { requireAuth } from '../../plugins/auth-context.js'

async function ni(reply: { code: (n: number) => { send: (b: unknown) => void } }) {
  reply.code(501).send({ error: 'not_implemented' })
}

export function createV1Routes(jwtSecret: string): FastifyPluginAsync {
  const authMw = requireAuth(jwtSecret)

  return async (f) => {
    await f.register(rateLimit, {
      max: 200,
      timeWindow: '1 minute',
    })

    await f.register(createAuthRoutes(prisma, jwtSecret), { prefix: '/auth' })

    f.get('/challenges', async () => ({ items: [], page: 1, limit: 20 }))
    f.get('/challenges/active', async () => ({ items: [] }))
    f.get<{ Params: { slug: string } }>('/challenges/:slug', async (req) => ({
      slug: req.params.slug,
      notFound: true,
    }))
    f.get<{ Params: { slug: string } }>('/challenges/:slug/leaderboard', async (req) => ({
      slug: req.params.slug,
      items: [],
    }))
    f.post('/challenges', { preHandler: authMw }, async (_req, reply) => ni(reply))
    f.patch<{ Params: { id: string } }>(
      '/challenges/:id',
      { preHandler: authMw },
      async (_req, reply) => ni(reply),
    )

    f.patch('/users/me', { preHandler: authMw }, async (_req, reply) => ni(reply))
    f.get('/users/me', { preHandler: authMw }, async (_req, reply) => ni(reply))
    f.get('/users/me/activity', { preHandler: authMw }, async (_req, reply) => ni(reply))
    f.post<{ Params: { submissionId: string } }>(
      '/users/me/pin/:submissionId',
      { preHandler: authMw },
      async (_req, reply) => ni(reply),
    )
    f.delete<{ Params: { submissionId: string } }>(
      '/users/me/pin/:submissionId',
      { preHandler: authMw },
      async (_req, reply) => ni(reply),
    )
    f.get<{ Params: { username: string } }>('/users/:username/followers', async (req) => ({
      username: req.params.username,
      items: [],
    }))
    f.get<{ Params: { username: string } }>('/users/:username/following', async (req) => ({
      username: req.params.username,
      items: [],
    }))
    f.get<{ Params: { username: string } }>('/users/:username/solutions', async (req) => ({
      username: req.params.username,
      items: [],
    }))
    f.get<{ Params: { username: string } }>('/users/:username', async (req) => ({
      username: req.params.username,
    }))

    f.post('/submissions', { preHandler: authMw }, async (_req, reply) => ni(reply))
    f.post<{ Params: { id: string } }>(
      '/submissions/:id/run',
      { preHandler: authMw },
      async (_req, reply) => ni(reply),
    )
    f.post<{ Params: { id: string } }>(
      '/submissions/:id/submit',
      { preHandler: authMw },
      async (_req, reply) => ni(reply),
    )
    f.get<{ Params: { id: string } }>('/submissions/:id', async (_req, reply) => ni(reply))
    f.get<{ Params: { challengeId: string } }>(
      '/submissions/challenge/:challengeId',
      async (req) => ({ challengeId: req.params.challengeId, items: [] }),
    )
    f.delete<{ Params: { id: string } }>(
      '/submissions/:id',
      { preHandler: authMw },
      async (_req, reply) => ni(reply),
    )

    f.post('/votes', { preHandler: authMw }, async (_req, reply) => ni(reply))
    f.delete<{ Params: { submissionId: string } }>(
      '/votes/:submissionId',
      { preHandler: authMw },
      async (_req, reply) => ni(reply),
    )
    f.get<{ Params: { submissionId: string } }>('/votes/submission/:submissionId', async (req) => ({
      submissionId: req.params.submissionId,
      up: 0,
      down: 0,
    }))

    f.get('/leaderboard/global', async () => ({ items: [] }))
    f.get<{ Params: { category: string } }>('/leaderboard/category/:category', async (req) => ({
      category: req.params.category,
      items: [],
    }))
    f.get('/leaderboard/friends', { preHandler: authMw }, async (_req, reply) => ni(reply))
    f.get('/leaderboard/me/rank', { preHandler: authMw }, async (_req, reply) => ni(reply))

    f.post<{ Params: { username: string } }>(
      '/follows/:username',
      { preHandler: authMw },
      async (_req, reply) => ni(reply),
    )
    f.delete<{ Params: { username: string } }>(
      '/follows/:username',
      { preHandler: authMw },
      async (_req, reply) => ni(reply),
    )

    f.get('/notifications', { preHandler: authMw }, async (_req, reply) => ni(reply))
    f.patch<{ Params: { id: string } }>(
      '/notifications/:id/read',
      { preHandler: authMw },
      async (_req, reply) => ni(reply),
    )
    f.patch('/notifications/read-all', { preHandler: authMw }, async (_req, reply) => ni(reply))

    f.get('/admin/moderation-queue', { preHandler: authMw }, async (_req, reply) => ni(reply))
    f.patch<{ Params: { id: string } }>(
      '/admin/moderation/:id',
      { preHandler: authMw },
      async (_req, reply) => ni(reply),
    )
    f.get('/admin/challenges/draft', { preHandler: authMw }, async (_req, reply) => ni(reply))
    f.post('/admin/challenges/generate', { preHandler: authMw }, async (_req, reply) => ni(reply))
    f.get('/admin/users', { preHandler: authMw }, async (_req, reply) => ni(reply))
    f.patch<{ Params: { id: string } }>(
      '/admin/users/:id/ban',
      { preHandler: authMw },
      async (_req, reply) => ni(reply),
    )
    f.patch<{ Params: { id: string } }>(
      '/admin/users/:id/unban',
      { preHandler: authMw },
      async (_req, reply) => ni(reply),
    )
    f.get<{ Params: { userId: string } }>(
      '/admin/rep-events/:userId',
      { preHandler: authMw },
      async (_req, reply) => ni(reply),
    )
    f.get('/admin/analytics', { preHandler: authMw }, async (_req, reply) => ni(reply))

    f.post('/portal/register', async (_req, reply) => ni(reply))
    f.post('/portal/challenges', async (_req, reply) => ni(reply))
    f.get('/portal/challenges', async (_req, reply) => ni(reply))
    f.post<{ Params: { submissionId: string } }>(
      '/portal/bookmark/:submissionId',
      async (_req, reply) => ni(reply),
    )
    f.get('/portal/bookmarks', async (_req, reply) => ni(reply))
  }
}
