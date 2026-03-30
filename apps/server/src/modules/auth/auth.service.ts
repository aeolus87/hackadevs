import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { PrismaClient } from '@prisma/client'
import { createUser, findUserByEmail } from './auth.model.js'
import type { LoginBody, RegisterBody } from './auth.schema.js'

const SALT_ROUNDS = 12

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
  const user = await createUser(prisma, {
    email: body.email,
    username: body.username,
    passwordHash,
    displayName: body.displayName,
  })
  return { ok: true as const, user }
}

export async function loginUser(prisma: PrismaClient, body: LoginBody) {
  const user = await findUserByEmail(prisma, body.email)
  if (!user || user.deletedAt || user.isBanned) {
    return { ok: false as const, error: 'invalid_credentials' }
  }
  const match = await bcrypt.compare(body.password, user.passwordHash)
  if (!match) {
    return { ok: false as const, error: 'invalid_credentials' }
  }
  return {
    ok: true as const,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
    },
  }
}

export function signAccessToken(secret: string, userId: string, username: string) {
  return jwt.sign({ sub: userId, username }, secret, { expiresIn: '7d' })
}
