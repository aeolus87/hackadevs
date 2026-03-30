export type EmailKind =
  | 'weekly_digest'
  | 'challenge_closing_soon'
  | 'company_bookmark_notification'
  | 'streak_at_risk'

export function createResendClient(apiKey: string) {
  const base = 'https://api.resend.com'

  async function send(opts: {
    from: string
    to: string | string[]
    subject: string
    html: string
    kind: EmailKind
  }) {
    const res = await fetch(`${base}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: opts.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        tags: [{ name: 'kind', value: opts.kind }],
      }),
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error(`Resend ${res.status}: ${t}`)
    }
    return (await res.json()) as { id?: string }
  }

  return { send }
}
