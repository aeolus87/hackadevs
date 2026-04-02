import type { FastifyPluginAsync } from 'fastify'
import type { ChallengeStatus } from '@prisma/client'
import type { ServerEnv } from '@hackadevs/config'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { requireAdmin } from '../../plugins/require-admin.js'
import { requireStaff } from '../../plugins/require-staff.js'
import { createResendClient } from '../../integrations/resend.client.js'
import { sendError, sendPaginated, sendSuccess } from '../../utils/api-response.js'
import { closeChallenge, publishChallenge } from '../challenges/challenges.service.js'
import { createAdminService } from './admin.service.js'
import { adminPatchChallengeSchema } from './admin.schema.js'

export type AdminRoutesOpts = { jwtSecret: string; env: ServerEnv }

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const portalListQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'all']).default('pending'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(20),
})

export const createAdminChallengeRoutes = (opts: AdminRoutesOpts): FastifyPluginAsync => {
  const { env } = opts
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

    f.post<{ Params: { id: string } }>(
      '/admin/challenges/:id/close',
      { preHandler: adminMw },
      async (req, reply) => {
        const id = req.params.id
        const existing = await prisma.challenge.findFirst({ where: { id, deletedAt: null } })
        if (!existing) return sendError(reply, 404, 'Not found')
        if (existing.status === 'CLOSED') {
          return sendSuccess(reply, existing)
        }
        if (existing.status !== 'ACTIVE') {
          return sendError(reply, 400, 'Only an active challenge can be closed')
        }
        const ch = await closeChallenge(prisma, id)
        if (!ch) return sendError(reply, 500, 'Close failed')
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

    f.get('/admin/portals', { preHandler: staffMw }, async (req, reply) => {
      const parsed = portalListQuerySchema.safeParse(req.query)
      if (!parsed.success) return sendError(reply, 400, 'Invalid query')
      const r = await adminApi.listCompanyPortals(
        parsed.data.status,
        parsed.data.page,
        parsed.data.limit,
      )
      return sendPaginated(reply, r.items, r.total, r.page, r.limit)
    })

    f.get<{ Params: { id: string } }>(
      '/admin/portals/:id',
      { preHandler: staffMw },
      async (req, reply) => {
        try {
          const row = await adminApi.getCompanyPortalByIdAdmin(req.params.id)
          return sendSuccess(reply, row)
        } catch (e) {
          const err = e as { statusCode?: number; message?: string }
          return sendError(reply, err.statusCode ?? 500, err.message ?? 'Error')
        }
      },
    )

    f.patch<{ Params: { id: string } }>(
      '/admin/portals/:id/approve',
      { preHandler: adminMw },
      async (req, reply) => {
        try {
          const row = await adminApi.approveCompanyPortal(req.params.id)
          if (env.RESEND_API_KEY) {
            const resend = createResendClient(env.RESEND_API_KEY)
            const base = env.FRONTEND_URL.replace(/\/$/, '')
            const registerUrl = `${base}/portal/register`
            const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#0f172a;background:#ffffff;margin:0;padding:24px">
<p>Hi ${escapeHtml(row.contactName)},</p>
<p>Your company portal for <strong>${escapeHtml(row.companyName)}</strong> is now active.</p>
<p>Sign in at <a href="${escapeHtml(registerUrl)}" style="color:#6366F1">${escapeHtml(registerUrl)}</a> to start submitting challenges and bookmarking top engineers.</p>
<p style="margin-top:24px;color:#64748b;font-size:13px">— HackaDevs</p>
</body></html>`
            await resend.send({
              from: env.RESEND_FROM ?? 'noreply@hackadevs.dev',
              to: row.contactEmail,
              subject: 'Your HackaDevs company portal is approved',
              html,
              kind: 'portal_approved',
            })
          }
          return sendSuccess(reply, row)
        } catch (e) {
          const err = e as { statusCode?: number; message?: string }
          return sendError(reply, err.statusCode ?? 500, err.message ?? 'Error')
        }
      },
    )

    f.patch<{ Params: { id: string } }>(
      '/admin/portals/:id/reject',
      { preHandler: adminMw },
      async (req, reply) => {
        try {
          const row = await adminApi.rejectCompanyPortal(req.params.id)
          if (env.RESEND_API_KEY) {
            const resend = createResendClient(env.RESEND_API_KEY)
            const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#0f172a;background:#ffffff;margin:0;padding:24px">
<p>Hi ${escapeHtml(row.contactName)},</p>
<p>We&apos;re not able to approve a portal for <strong>${escapeHtml(row.companyName)}</strong> at this time.</p>
<p>Feel free to reapply in 30 days.</p>
<p style="margin-top:24px;color:#64748b;font-size:13px">— HackaDevs</p>
</body></html>`
            await resend.send({
              from: env.RESEND_FROM ?? 'noreply@hackadevs.dev',
              to: row.contactEmail,
              subject: 'HackaDevs portal application',
              html,
              kind: 'portal_rejected',
            })
          }
          return sendSuccess(reply, row)
        } catch (e) {
          const err = e as { statusCode?: number; message?: string }
          return sendError(reply, err.statusCode ?? 500, err.message ?? 'Error')
        }
      },
    )
  }
}
