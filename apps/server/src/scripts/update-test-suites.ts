import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { CHALLENGE_TEST_SUITES } from '../challenge-test-suites.js'
import { prisma } from '../lib/prisma.js'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
config({ path: path.join(repoRoot, '.env') })

async function main() {
  for (const [slug, testSuite] of Object.entries(CHALLENGE_TEST_SUITES)) {
    const r = await prisma.challenge.updateMany({
      where: { slug, deletedAt: null },
      data: { testSuite },
    })
    console.info(`${slug}: updated ${r.count} row(s)`)
  }
  console.info('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
