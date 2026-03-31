import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
const flagPath = join(dir, '.vitest-db-ready')
process.env.VITEST_DB_READY = existsSync(flagPath) ? readFileSync(flagPath, 'utf8').trim() : '0'
