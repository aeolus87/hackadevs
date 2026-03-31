export type Judge0Status = {
  id: number
  description?: string
}

export type Judge0Result = {
  stdout?: string | null
  stderr?: string | null
  compile_output?: string | null
  message?: string | null
  time?: string | null
  memory?: number | null
  status: Judge0Status
}

export type RunCodeOptions = {
  sourceCode: string
  languageId: number
  stdin?: string
}

const DEFAULT_LIMITS = {
  cpu_time_limit: 5,
  memory_limit: 262144,
}

export function createJudge0Client(apiUrl: string, apiKey?: string) {
  const base = apiUrl.replace(/\/$/, '')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }

  async function createSubmission(body: Record<string, unknown>) {
    const res = await fetch(`${base}/submissions?base64_encoded=false`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, ...DEFAULT_LIMITS }),
    })
    if (!res.ok) throw new Error(`Judge0 submit failed: ${res.status}`)
    return (await res.json()) as { token: string }
  }

  async function getSubmission(token: string): Promise<Judge0Result> {
    const res = await fetch(`${base}/submissions/${token}?base64_encoded=false`, {
      headers,
    })
    if (!res.ok) throw new Error(`Judge0 poll failed: ${res.status}`)
    return (await res.json()) as Judge0Result
  }

  async function pollUntilDone(token: string, opts?: { maxAttempts?: number; delayMs?: number }) {
    const max = opts?.maxAttempts ?? 40
    const delay = opts?.delayMs ?? 250
    for (let i = 0; i < max; i++) {
      const s = await getSubmission(token)
      if (s.status.id >= 3) return s
      await new Promise((r) => setTimeout(r, delay))
    }
    throw new Error('Judge0 poll timeout')
  }

  return {
    async runSingle(opts: RunCodeOptions) {
      const { token } = await createSubmission({
        source_code: opts.sourceCode,
        language_id: opts.languageId,
        stdin: opts.stdin ?? '',
      })
      return pollUntilDone(token)
    },
  }
}
