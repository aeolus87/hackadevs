import type { PrismaClient } from '@prisma/client'

export function findUserByEmail(prisma: PrismaClient, email: string) {
  return prisma.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null },
  })
}

export function findUserByUsername(prisma: PrismaClient, username: string) {
  return prisma.user.findFirst({
    where: { username: username.toLowerCase(), deletedAt: null },
  })
}

export async function createUser(
  prisma: PrismaClient,
  data: {
    email: string
    username: string
    passwordHash: string
    displayName: string
  },
) {
  return prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      username: data.username.toLowerCase(),
      passwordHash: data.passwordHash,
      displayName: data.displayName,
    },
    select: { id: true },
  })
}
