import type { FastifyReply, FastifyRequest } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import {
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  registerBodySchema,
} from './auth.schema.js'
import {
  issueRefreshTokenPair,
  loginUser,
  registerUser,
  revokeRefreshTokenByRaw,
  rotateRefreshToken,
  signAccessToken,
} from './auth.service.js'
import { toUserPublic } from './user-public.js'

export function buildAuthController(prisma: PrismaClient, jwtSecret: string) {
  return {
    async register(req: FastifyRequest, reply: FastifyReply) {
      const parsed = registerBodySchema.safeParse(req.body)
      if (!parsed.success) {
        throw Object.assign(new Error('Invalid request body'), { statusCode: 400 })
      }
      const result = await registerUser(prisma, parsed.data)
      if (!result.ok) {
        if (result.error === 'email_taken') {
          throw Object.assign(new Error('Email already registered'), { statusCode: 409 })
        }
        if (result.error === 'username_taken') {
          throw Object.assign(new Error('Username already taken'), { statusCode: 409 })
        }
        throw Object.assign(new Error('Registration failed'), { statusCode: 400 })
      }
      const userRow = await prisma.user.findFirst({
        where: { id: result.user.id },
        select: { role: true },
      })
      const role = userRow?.role ?? 'USER'
      const token = signAccessToken(jwtSecret, result.user.id, result.user.username, role)
      const { refreshToken } = await issueRefreshTokenPair(prisma, result.user.id)
      return reply.code(201).send({ accessToken: token, refreshToken, user: result.user })
    },
    async login(req: FastifyRequest, reply: FastifyReply) {
      const parsed = loginBodySchema.safeParse(req.body)
      if (!parsed.success) {
        throw Object.assign(new Error('Invalid request body'), { statusCode: 400 })
      }
      const result = await loginUser(prisma, parsed.data)
      if (!result.ok) {
        throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 })
      }
      const userRow = await prisma.user.findFirst({
        where: { id: result.user.id },
        select: { role: true },
      })
      const role = userRow?.role ?? 'USER'
      const token = signAccessToken(jwtSecret, result.user.id, result.user.username, role)
      const { refreshToken } = await issueRefreshTokenPair(prisma, result.user.id)
      return reply.send({ accessToken: token, refreshToken, user: result.user })
    },
    async refresh(req: FastifyRequest, reply: FastifyReply) {
      const parsed = refreshBodySchema.safeParse(req.body)
      if (!parsed.success) {
        throw Object.assign(new Error('Invalid request body'), { statusCode: 400 })
      }
      const rotated = await rotateRefreshToken(prisma, parsed.data.refreshToken)
      if (!rotated) {
        throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 })
      }
      const row = await prisma.user.findFirst({
        where: { id: rotated.userId, deletedAt: null },
        include: { categoryReps: { where: { deletedAt: null } } },
      })
      if (!row || row.isBanned) {
        throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 })
      }
      const user = toUserPublic(row)
      const token = signAccessToken(jwtSecret, row.id, row.username, row.role)
      return reply.send({
        accessToken: token,
        refreshToken: rotated.refreshToken,
        user,
      })
    },
    async logout(req: FastifyRequest, reply: FastifyReply) {
      const parsed = logoutBodySchema.safeParse(req.body ?? {})
      if (parsed.success && parsed.data.refreshToken) {
        await revokeRefreshTokenByRaw(prisma, parsed.data.refreshToken)
      }
      return reply.code(204).send()
    },
  }
}
