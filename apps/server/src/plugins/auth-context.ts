import type { FastifyRequest } from 'fastify'
import jwt from 'jsonwebtoken'

export type JwtUser = { sub: string; username: string }

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
  return (
    req: FastifyRequest,
    reply: import('fastify').FastifyReply,
    done: (err?: Error) => void,
  ) => {
    const u = parseBearer(req, secret)
    if (!u) {
      reply.code(401).send({ error: 'unauthorized' })
      return
    }
    req.jwtUser = u
    done()
  }
}
