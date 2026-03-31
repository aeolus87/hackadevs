import type { FastifyReply, FastifyRequest } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { parseBearer } from './auth-context.js'
import { sendError } from '../utils/api-response.js'

export function requireAdmin(prisma: PrismaClient, jwtSecret: string) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const u = parseBearer(req, jwtSecret)
    if (!u) {
      return sendError(reply, 401, 'Unauthorized')
    }
    req.jwtUser = u
    const user = await prisma.user.findFirst({
      where: { id: u.sub, deletedAt: null },
    })
    if (!user || user.role !== 'ADMIN') {
      return sendError(reply, 403, 'Forbidden')
    }
  }
}
