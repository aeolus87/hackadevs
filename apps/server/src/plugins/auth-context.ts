import type { FastifyRequest } from 'fastify'
import type { UserRole } from '@prisma/client'
import jwt from 'jsonwebtoken'

export type JwtUser = { sub: string; username: string; role?: UserRole }

export function parseBearer(req: FastifyRequest, secret: string): JwtUser | null {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return null
  const token = h.slice(7)
  try {
    const p = jwt.verify(token, secret) as JwtUser
    if (typeof p.sub !== 'string' || typeof p.username !== 'string') return null
    return p
  } catch {
    return null
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    jwtUser?: JwtUser
  }
}

export function requireAuth(secret: string) {
  return async (req: FastifyRequest, reply: import('fastify').FastifyReply) => {
    const u = parseBearer(req, secret)
    if (!u) {
      return reply.code(401).send({ success: false, message: 'Unauthorized' })
    }
    req.jwtUser = u
  }
}

export function optionalAuth(secret: string) {
  return async (req: FastifyRequest) => {
    const u = parseBearer(req, secret)
    if (u) req.jwtUser = u
  }
}
