import { prisma } from '../lib/prisma.js'
import { createResendClient } from '../integrations/resend.client.js'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function runWeeklyDigestJob(
  resendApiKey: string | undefined,
  resendFrom: string,
  frontendUrl: string,
) {
  if (!resendApiKey) return
  const resend = createResendClient(resendApiKey)
  const from = resendFrom.trim() || 'noreply@hackadevs.dev'
  const since = new Date(Date.now() - 30 * 86400000)
  const weekAgo = new Date(Date.now() - 7 * 86400000)
  const subs = await prisma.submission.findMany({
    where: { status: 'PUBLISHED', submittedAt: { gte: since }, deletedAt: null },
    distinct: ['userId'],
    select: { userId: true },
  })
  const leaderboardUrl = `${frontendUrl.replace(/\/$/, '')}/leaderboard`
  for (const { userId } of subs) {
    const u = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    })
    if (!u?.email) continue
    const top = await prisma.submission.findFirst({
      where: {
        userId,
        status: 'PUBLISHED',
        deletedAt: null,
        submittedAt: { gte: weekAgo },
      },
      orderBy: { compositeScore: 'desc' },
      include: { challenge: { select: { title: true } } },
    })
    const attempted = await prisma.submission.findMany({
      where: { userId, deletedAt: null },
      distinct: ['challengeId'],
      select: { challengeId: true },
    })
    const skipIds = attempted.map((a) => a.challengeId)
    const fresh = await prisma.challenge.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        ...(skipIds.length > 0 ? { id: { notIn: skipIds } } : {}),
      },
      orderBy: { closesAt: 'asc' },
      take: 3,
      select: { title: true },
    })
    const rankLabel = u.globalRank != null ? String(u.globalRank) : '—'
    const delta = u.weeklyRepDelta
    const streak = u.currentStreakDays
    const rankBit =
      top?.finalRank != null
        ? `rank #${top.finalRank}`
        : top?.preliminaryRank != null
          ? `preliminary #${top.preliminaryRank}`
          : null
    const topLine =
      top?.challenge?.title != null
        ? rankBit
          ? `${top.challenge.title} · ${rankBit}`
          : top.challenge.title
        : '—'
    const freshList =
      fresh.length > 0
        ? `<ul style="margin:12px 0;padding-left:20px">${fresh.map((c) => `<li>${escapeHtml(c.title)}</li>`).join('')}</ul>`
        : '<p style="margin:12px 0;color:#64748b">You&apos;ve looked at every active challenge — nice.</p>'
    const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
<p>Hi ${escapeHtml(u.displayName)},</p>
<p>Here&apos;s your week on HackaDevs:</p>
<ul style="line-height:1.6">
<li><strong>Global rank</strong> #${escapeHtml(rankLabel)}</li>
<li><strong>Weekly rep</strong> +${delta}</li>
<li><strong>Streak</strong> ${streak} day${streak === 1 ? '' : 's'}</li>
</ul>
<p><strong>Top solution this week</strong><br/>${escapeHtml(topLine)}</p>
<p><strong>Active challenges you haven&apos;t tried yet</strong></p>
${freshList}
<p style="margin-top:28px"><a href="${escapeHtml(leaderboardUrl)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9999px;font-weight:600">See the leaderboard</a></p>
</body></html>`
    await resend.send({
      from,
      to: u.email,
      subject: `Your HackaDevs week — rank #${rankLabel}, +${delta} rep`,
      html,
      kind: 'weekly_digest',
    })
  }
}
