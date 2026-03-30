import type { FastifyReply, FastifyRequest } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { loginBodySchema, registerBodySchema } from './auth.schema.js'
import { loginUser, registerUser, signAccessToken } from './auth.service.js'

export function buildAuthController(prisma: PrismaClient, jwtSecret: string) {
  return {
    async register(req: FastifyRequest, reply: FastifyReply) {
      const parsed = registerBodySchema.safeParse(req.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation_error', details: parsed.error.flatten() })
      }
      const result = await registerUser(prisma, parsed.data)
      if (!result.ok) {
        return reply.code(409).send({ error: result.error })
      }
      const token = signAccessToken(jwtSecret, result.user.id, result.user.username)
      return reply.code(201).send({ accessToken: token, user: result.user })
    },
    async login(req: FastifyRequest, reply: FastifyReply) {
      const parsed = loginBodySchema.safeParse(req.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation_error', details: parsed.error.flatten() })
      }
      const result = await loginUser(prisma, parsed.data)
      if (!result.ok) {
        return reply.code(401).send({ error: result.error })
      }
      const token = signAccessToken(jwtSecret, result.user.id, result.user.username)
      return reply.send({ accessToken: token, user: result.user })
    },
    async github(_req: FastifyRequest, reply: FastifyReply) {
      return reply.code(501).send({ error: 'not_implemented' })
    },
    async refresh(_req: FastifyRequest, reply: FastifyReply) {
      return reply.code(501).send({ error: 'not_implemented' })
    },
    async logout(_req: FastifyRequest, reply: FastifyReply) {
      return reply.code(204).send()
    },
  }
}
