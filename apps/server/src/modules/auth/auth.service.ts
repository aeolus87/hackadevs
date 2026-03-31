import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { PrismaClient, UserRole } from '@prisma/client'
import { createUser, findUserByEmail } from './auth.model.js'
import type { LoginBody, RegisterBody } from './auth.schema.js'
import { toUserPublic, type UserPublicShape } from './user-public.js'

const SALT_ROUNDS = 12
const REFRESH_TTL_MS = 30 * 86400000

function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex')
}

export async function issueRefreshTokenPair(prisma: PrismaClient, userId: string) {
  const raw = randomBytes(32).toString('base64url')
  const tokenHash = hashRefreshToken(raw)
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS)
  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  })
  return { refreshToken: raw }
}

export async function rotateRefreshToken(
  prisma: PrismaClient,
  raw: string,
): Promise<{ userId: string; refreshToken: string } | null> {
  const tokenHash = hashRefreshToken(raw)
  const row = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  })
  if (!row) return null
  await prisma.refreshToken.update({
    where: { id: row.id },
    data: { revokedAt: new Date() },
  })
  const next = await issueRefreshTokenPair(prisma, row.userId)
  return { userId: row.userId, refreshToken: next.refreshToken }
}

export async function revokeRefreshTokenByRaw(prisma: PrismaClient, raw: string | undefined) {
  if (!raw?.trim()) return
  const tokenHash = hashRefreshToken(raw)
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

async function loadUserPublic(
  prisma: PrismaClient,
  userId: string,
): Promise<UserPublicShape | null> {
  const u = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: { categoryReps: { where: { deletedAt: null } } },
  })
  return u ? toUserPublic(u) : null
}

export async function registerUser(prisma: PrismaClient, body: RegisterBody) {
  const existing = await findUserByEmail(prisma, body.email)
  if (existing) {
    return { ok: false as const, error: 'email_taken' }
  }
  const takenName = await prisma.user.findFirst({
    where: { username: body.username.toLowerCase(), deletedAt: null },
  })
  if (takenName) {
    return { ok: false as const, error: 'username_taken' }
  }
  const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS)
  const created = await createUser(prisma, {
    email: body.email,
    username: body.username,
    passwordHash,
    displayName: body.displayName,
  })
  const publicUser = await loadUserPublic(prisma, created.id)
  if (!publicUser) {
    return { ok: false as const, error: 'invalid_credentials' }
  }
  return { ok: true as const, user: publicUser }
}

export async function loginUser(prisma: PrismaClient, body: LoginBody) {
  const user = await findUserByEmail(prisma, body.email)
  if (!user || user.deletedAt || user.isBanned) {
    return { ok: false as const, error: 'invalid_credentials' }
  }
  if (!user.passwordHash) {
    return { ok: false as const, error: 'invalid_credentials' }
  }
  const valid = await bcrypt.compare(body.password, user.passwordHash)
  if (!valid) {
    return { ok: false as const, error: 'invalid_credentials' }
  }
  const publicUser = await loadUserPublic(prisma, user.id)
  if (!publicUser) {
    return { ok: false as const, error: 'invalid_credentials' }
  }
  return { ok: true as const, user: publicUser }
}

export function signAccessToken(secret: string, userId: string, username: string, role: UserRole) {
  return jwt.sign({ sub: userId, username, role }, secret, { expiresIn: '7d' })
}
