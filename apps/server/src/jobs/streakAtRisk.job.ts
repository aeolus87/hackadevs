import { prisma } from '../lib/prisma.js'
import { createResendClient } from '../integrations/resend.client.js'

function utcStartOfDay(): Date {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

export async function runStreakAtRiskJob(
  resendApiKey: string | undefined,
  resendFrom: string,
  frontendUrl: string,
) {
  if (!resendApiKey) return
  const resend = createResendClient(resendApiKey)
  const from = resendFrom.trim() || 'noreply@hackadevs.dev'
  const todayStart = utcStartOfDay()

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      isBanned: false,
      currentStreakDays: { gte: 7 },
      lastSubmissionDate: { not: null, lt: todayStart },
      OR: [{ streakAtRiskEmailSentAt: null }, { streakAtRiskEmailSentAt: { lt: todayStart } }],
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      currentStreakDays: true,
    },
  })

  const challengesUrl = `${frontendUrl.replace(/\/$/, '')}/challenges`
  const batches = chunk(users, 50)
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]!
    for (const u of batch) {
      const n = u.currentStreakDays
      const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#0f172a;background:#ffffff;margin:0;padding:24px">
<p>Hi ${escapeHtml(u.displayName)},</p>
<p>You&apos;re on a <strong>${n}</strong>-day streak on HackaDevs.</p>
<p>You haven&apos;t submitted a solution today — your streak resets at midnight UTC.</p>
<p style="margin:28px 0">
<a href="${escapeHtml(challengesUrl)}" style="display:inline-block;background:#6366F1;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:9999px;font-weight:600;font-size:15px">Browse today&apos;s challenges</a>
</p>
<p>Even a beginner challenge counts. Don&apos;t let ${n} days go to waste.</p>
<p style="margin-top:28px;color:#64748b;font-size:13px">— HackaDevs</p>
</body></html>`
      await resend.send({
        from,
        to: u.email,
        subject: `Your ${n}-day streak ends at midnight ⚡`,
        html,
        kind: 'streak_at_risk',
      })
      await prisma.user.update({
        where: { id: u.id },
        data: { streakAtRiskEmailSentAt: new Date() },
      })
    }
    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, 100))
    }
  }
}
