import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const apiBase = 'http://127.0.0.1:4010'
const healthUrl = `${apiBase}/api/health`
const webOrigin = 'http://127.0.0.1:3123'

function waitForHealth(maxMs = 120_000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      fetch(healthUrl)
        .then((r) => {
          if (r.ok) resolve()
          else schedule()
        })
        .catch(() => schedule())
    }
    const schedule = () => {
      if (Date.now() - start > maxMs) {
        reject(new Error(`Timeout waiting for ${healthUrl}`))
        return
      }
      setTimeout(tryOnce, 400)
    }
    tryOnce()
  })
}

const server = spawn('pnpm', ['--filter', '@aeokit-webapp/server', 'exec', 'tsx', 'src/index.ts'], {
  cwd: root,
  env: {
    ...process.env,
    PORT: '4010',
    FRONTEND_URL: webOrigin,
    NODE_ENV: 'development',
  },
  stdio: 'inherit',
})

server.on('exit', (code, signal) => {
  if (signal !== 'SIGTERM' && code !== 0 && code !== null) {
    process.exit(code ?? 1)
  }
})

await waitForHealth()

const web = spawn(
  'pnpm',
  ['--filter', '@aeokit-webapp/web', 'exec', 'vite', '--port', '3123', '--host', '127.0.0.1'],
  {
    cwd: root,
    env: {
      ...process.env,
      VITE_API_URL: `${apiBase}/api`,
    },
    stdio: 'inherit',
  },
)

web.on('exit', (code, signal) => {
  if (signal !== 'SIGTERM' && code !== 0 && code !== null) {
    server.kill('SIGTERM')
    process.exit(code ?? 1)
  }
})

function shutdown() {
  web.kill('SIGTERM')
  server.kill('SIGTERM')
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
