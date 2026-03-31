import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const flagPath = join(dirname(fileURLToPath(import.meta.url)), '.vitest-db-ready')

export default async function globalSetup() {
  if (!process.env.DATABASE_URL) {
    writeFileSync(flagPath, '0')
    return
  }
  const { prisma } = await import('../src/lib/prisma.js')
  try {
    await prisma.$connect()
    writeFileSync(flagPath, '1')
  } catch {
    writeFileSync(flagPath, '0')
  } finally {
    await prisma.$disconnect().catch(() => undefined)
  }
}
