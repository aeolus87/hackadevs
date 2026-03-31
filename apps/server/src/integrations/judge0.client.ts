import type { SubmissionLanguage } from '@prisma/client'

const LANG_MAP: Record<SubmissionLanguage, number> = {
  JS: 63,
  TS: 74,
  PYTHON: 71,
  GO: 60,
  RUST: 73,
  JAVA: 62,
  CPP: 54,
  CSHARP: 51,
  RUBY: 72,
}

const DEFAULT_BODY = {
  cpu_time_limit: 5,
  memory_limit: 262144,
}

export type Judge0PollResult = {
  statusId: number
  stdout: string | null
  stderr: string | null
  time: string | null
  memory: number | null
  compileOutput: string | null
}

export type RunWithPollingResult = {
  passed: boolean
  stdout: string | null
  stderr: string | null
  executionTimeMs: number
  memoryUsedMb: number
}

export function createJudge0Client(apiUrl: string, apiKey?: string) {
  const base = apiUrl.replace(/\/$/, '')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (apiKey) {
    headers['X-Auth-Token'] = apiKey
  }

  async function runCode(params: {
    code: string
    language: SubmissionLanguage
    stdin?: string
    expectedOutput?: string
  }): Promise<string> {
    const res = await fetch(`${base}/submissions?base64_encoded=false&wait=false`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_code: params.code,
        language_id: LANG_MAP[params.language],
        stdin: params.stdin ?? '',
        expected_output: params.expectedOutput,
        ...DEFAULT_BODY,
      }),
    })
    if (!res.ok) throw new Error(`Judge0 submit failed: ${res.status}`)
    const j = (await res.json()) as { token: string }
    return j.token
  }

  async function getResult(token: string): Promise<Judge0PollResult> {
    const res = await fetch(
      `${base}/submissions/${token}?base64_encoded=false&fields=status,stdout,stderr,time,memory,compile_output`,
      { headers },
    )
    if (!res.ok) throw new Error(`Judge0 poll failed: ${res.status}`)
    const j = (await res.json()) as {
      status?: { id: number }
      stdout?: string | null
      stderr?: string | null
      time?: string | null
      memory?: number | null
      compile_output?: string | null
    }
    return {
      statusId: j.status?.id ?? 0,
      stdout: j.stdout ?? null,
      stderr: j.stderr ?? null,
      time: j.time ?? null,
      memory: j.memory ?? null,
      compileOutput: j.compile_output ?? null,
    }
  }

  async function runWithPolling(params: {
    code: string
    language: SubmissionLanguage
    stdin?: string
    expectedOutput?: string
  }): Promise<RunWithPollingResult> {
    const token = await runCode(params)
    let last: Judge0PollResult | null = null
    for (let i = 0; i < 10; i++) {
      last = await getResult(token)
      if (last.statusId >= 3) break
      await new Promise((r) => setTimeout(r, 800))
    }
    if (!last) {
      return {
        passed: false,
        stdout: null,
        stderr: null,
        executionTimeMs: 0,
        memoryUsedMb: 0,
      }
    }
    const timeSec = last.time ? Number.parseFloat(last.time) : 0
    const memKb = last.memory ?? 0
    return {
      passed: last.statusId === 3,
      stdout: last.stdout,
      stderr: last.stderr,
      executionTimeMs: Number.isFinite(timeSec) ? Math.round(timeSec * 1000) : 0,
      memoryUsedMb: memKb / 1024,
    }
  }

  return { runCode, getResult, runWithPolling }
}
