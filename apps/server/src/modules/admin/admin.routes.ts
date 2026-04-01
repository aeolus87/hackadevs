import type { FastifyPluginAsync } from 'fastify'
import type { ChallengeStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { requireAdmin } from '../../plugins/require-admin.js'
import { requireStaff } from '../../plugins/require-staff.js'
import { sendError, sendPaginated, sendSuccess } from '../../utils/api-response.js'
import { publishChallenge } from '../challenges/challenges.service.js'
import { createAdminService } from './admin.service.js'
import { adminPatchChallengeSchema } from './admin.schema.js'

export type AdminRoutesOpts = { jwtSecret: string }

export const createAdminChallengeRoutes = (opts: AdminRoutesOpts): FastifyPluginAsync => {
  const adminMw = [requireAdmin(prisma, opts.jwtSecret)]
  const staffMw = [requireStaff(prisma, opts.jwtSecret)]
  const adminApi = createAdminService(prisma)

  return async (f) => {
    f.get('/admin/challenges', { preHandler: staffMw }, async (req, reply) => {
      const q = req.query as { status?: string; page?: string; limit?: string }
      const page = Math.max(1, Number(q.page) || 1)
      const limit = Math.min(50, Math.max(1, Number(q.limit) || 20))
      const status = (q.status ?? 'DRAFT') as ChallengeStatus
      const r = await adminApi.listChallengesForAdmin(status, page, limit)
      return sendPaginated(reply, r.items, r.total, r.page, r.limit)
    })

    f.get<{ Params: { id: string } }>(
      '/admin/challenges/:id',
      { preHandler: staffMw },
      async (req, reply) => {
        const ch = await adminApi.getChallengeByIdAdmin(req.params.id)
        if (!ch) return sendError(reply, 404, 'Not found')
        return sendSuccess(reply, ch)
      },
    )

    f.patch<{ Params: { id: string } }>(
      '/admin/challenges/:id',
      { preHandler: adminMw },
      async (req, reply) => {
        const parsed = adminPatchChallengeSchema.safeParse(req.body)
        if (!parsed.success) return sendError(reply, 400, 'Invalid body')
        try {
          const ch = await adminApi.patchChallengeAdmin(req.params.id, parsed.data)
          return sendSuccess(reply, ch)
        } catch (e) {
          const err = e as { statusCode?: number; message?: string }
          return sendError(reply, err.statusCode ?? 500, err.message ?? 'Error')
        }
      },
    )

    f.post<{ Params: { id: string } }>(
      '/admin/challenges/:id/publish',
      { preHandler: adminMw },
      async (req, reply) => {
        const ch = await publishChallenge(prisma, req.params.id)
        if (!ch) return sendError(reply, 404, 'Not found')
        return sendSuccess(reply, ch)
      },
    )

    f.delete<{ Params: { id: string } }>(
      '/admin/challenges/:id',
      { preHandler: adminMw },
      async (req, reply) => {
        try {
          await adminApi.softDeleteChallengeAdmin(req.params.id)
          return sendSuccess(reply, { ok: true })
        } catch (e) {
          const err = e as { statusCode?: number; message?: string }
          return sendError(reply, err.statusCode ?? 500, err.message ?? 'Error')
        }
      },
    )
  }
}
