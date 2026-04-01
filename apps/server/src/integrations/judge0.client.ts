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

function judge0Err(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
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

type Judge0SubmissionResponse = {
  status?: { id: number; description?: string }
  stdout?: string | null
  stderr?: string | null
  time?: string | null
  memory?: number | null
  compile_output?: string | null
  token?: string
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

  async function postSubmission(
    params: {
      code: string
      language: SubmissionLanguage
      stdin?: string
      expectedOutput?: string
    },
    wait: boolean,
  ): Promise<Response> {
    const qs = new URLSearchParams({
      base64_encoded: 'false',
      wait: wait ? 'true' : 'false',
    })
    return fetch(`${base}/submissions?${qs.toString()}`, {
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
  }

  async function parseSubmissionResponse(res: Response): Promise<Judge0SubmissionResponse> {
    if (!res.ok) {
      let detail = ''
      try {
        const errBody = (await res.json()) as { error?: string; message?: string }
        detail = errBody?.error ?? errBody?.message ?? ''
      } catch {
        try {
          detail = (await res.text()).slice(0, 200)
        } catch {
          detail = ''
        }
      }
      throw judge0Err(
        `Judge0 request failed: HTTP ${res.status}${detail ? ` — ${detail}` : ''}`,
        502,
      )
    }
    try {
      return (await res.json()) as Judge0SubmissionResponse
    } catch {
      throw judge0Err('Judge0 returned invalid JSON', 502)
    }
  }

  async function runCode(params: {
    code: string
    language: SubmissionLanguage
    stdin?: string
    expectedOutput?: string
  }): Promise<string> {
    let res: Response
    try {
      res = await postSubmission(params, false)
    } catch (e) {
      const hint = e instanceof Error ? e.message : String(e)
      throw judge0Err(
        `Cannot reach Judge0 at ${base} (${hint}). Start Judge0 or set JUDGE0_API_URL.`,
        503,
      )
    }
    const j = await parseSubmissionResponse(res)
    if (!j.token) {
      throw judge0Err('Judge0 did not return a submission token', 502)
    }
    return j.token
  }

  async function getResult(token: string): Promise<Judge0PollResult> {
    let res: Response
    try {
      res = await fetch(
        `${base}/submissions/${token}?base64_encoded=false&fields=status,stdout,stderr,time,memory,compile_output`,
        { headers },
      )
    } catch (e) {
      const hint = e instanceof Error ? e.message : String(e)
      throw judge0Err(`Cannot reach Judge0 at ${base} while polling (${hint}).`, 503)
    }
    if (!res.ok) {
      throw judge0Err(`Judge0 poll failed: HTTP ${res.status}`, 502)
    }
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

  function submissionToRunResult(j: Judge0SubmissionResponse): RunWithPollingResult {
    const statusId = j.status?.id ?? 0
    const timeSec = j.time ? Number.parseFloat(j.time) : 0
    const memKb = j.memory ?? 0
    const compile = j.compile_output != null ? String(j.compile_output) : null
    const errText = j.stderr != null && j.stderr !== '' ? j.stderr : compile
    return {
      passed: statusId === 3,
      stdout: j.stdout ?? null,
      stderr: errText,
      executionTimeMs: Number.isFinite(timeSec) ? Math.round(timeSec * 1000) : 0,
      memoryUsedMb: memKb / 1024,
    }
  }

  async function runWithPolling(params: {
    code: string
    language: SubmissionLanguage
    stdin?: string
    expectedOutput?: string
  }): Promise<RunWithPollingResult> {
    let res: Response
    try {
      res = await postSubmission(params, true)
    } catch (e) {
      const hint = e instanceof Error ? e.message : String(e)
      throw judge0Err(
        `Cannot reach Judge0 at ${base} (${hint}). Start Judge0 or set JUDGE0_API_URL.`,
        503,
      )
    }
    const j = await parseSubmissionResponse(res)
    return submissionToRunResult(j)
  }

  return { runCode, getResult, runWithPolling }
}
