import { prisma } from '../lib/prisma.js'
import { createResendClient } from '../integrations/resend.client.js'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function diffLabel(d: number): string {
  if (d > 0) return `+${d}`
  return String(d)
}

function diffColor(d: number): string {
  if (d > 0) return '#059669'
  if (d < 0) return '#e11d48'
  return '#64748b'
}

export async function runWeeklyDigestJob(
  resendApiKey: string | undefined,
  resendFrom: string,
  frontendUrl: string,
) {
  if (!resendApiKey) return
  const resend = createResendClient(resendApiKey)
  const from = resendFrom.trim() || 'noreply@hackadevs.dev'
  const base = frontendUrl.replace(/\/$/, '')
  const since = new Date(Date.now() - 30 * 86400000)
  const weekAgo = new Date(Date.now() - 7 * 86400000)
  const subs = await prisma.submission.findMany({
    where: { status: 'PUBLISHED', submittedAt: { gte: since }, deletedAt: null },
    distinct: ['userId'],
    select: { userId: true },
  })
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
      include: { challenge: { select: { title: true, slug: true } } },
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
      select: { title: true, slug: true, difficulty: true },
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
    const solutionUrl =
      top?.challenge?.slug && top.id
        ? `${base}/challenge/${encodeURIComponent(top.challenge.slug)}/solutions/${encodeURIComponent(top.id)}`
        : null
    const repColor = diffColor(delta)
    const freshBlocks =
      fresh.length > 0
        ? fresh
            .map((c) => {
              const href = `${base}/challenge/${encodeURIComponent(c.slug)}`
              const diff = escapeHtml(String(c.difficulty).replace(/_/g, ' '))
              return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:12px 0;border:1px solid #e2e8f0;border-radius:12px"><tr><td style="padding:14px 16px">
<p style="margin:0 0 8px;font-weight:600;color:#0f172a">${escapeHtml(c.title)}</p>
<p style="margin:0 0 10px"><span style="display:inline-block;padding:4px 10px;border-radius:9999px;font-size:12px;background:#f1f5f9;color:#334155">${diff}</span></p>
<a href="${escapeHtml(href)}" style="color:#6366F1;font-weight:600;text-decoration:none">Solve it →</a>
</td></tr></table>`
            })
            .join('')
        : '<p style="margin:12px 0;color:#64748b">No active challenges you haven&apos;t tried — explore the catalog for more.</p>'
    const bestSection = top?.challenge?.title
      ? `<p style="margin:0 0 8px;font-size:17px;font-weight:600;color:#0f172a">${escapeHtml(top.challenge.title)}</p>
<p style="margin:0 0 12px;color:#334155">${rankBit ? escapeHtml(rankBit) : '—'}</p>
${
  solutionUrl
    ? `<a href="${escapeHtml(solutionUrl)}" style="color:#6366F1;font-weight:600;text-decoration:none">View solution →</a>`
    : ''
}`
      : '<p style="margin:0;color:#64748b">You didn&apos;t submit this week. Don&apos;t miss next week.</p>'
    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#ffffff">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff"><tr><td align="center" style="padding:24px 16px">
<table role="presentation" width="100%" style="max-width:560px;font-family:system-ui,-apple-system,sans-serif;color:#0f172a">
<tr><td style="padding-bottom:12px">
<span style="font-size:20px;font-weight:700;color:#6366F1;letter-spacing:-0.02em">HackaDevs</span>
</td></tr>
<tr><td style="padding-bottom:20px">
<p style="margin:0;font-size:15px;color:#334155">Hi ${escapeHtml(u.displayName)},</p>
</td></tr>
<tr><td style="padding:20px 0;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0">
<p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em">Your week</p>
<p style="margin:0 0 8px;font-size:28px;font-weight:700;line-height:1.2">Rank #${escapeHtml(rankLabel)}</p>
<p style="margin:0 0 8px;font-size:16px"><span style="color:${repColor};font-weight:600">${escapeHtml(diffLabel(delta))} rep</span> <span style="color:#64748b">this week</span></p>
<p style="margin:0;font-size:15px;color:#334155">Streak: <strong>${streak}</strong> day${streak === 1 ? '' : 's'}</p>
</td></tr>
<tr><td style="padding:24px 0">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em">Your best solution this week</p>
${bestSection}
</td></tr>
<tr><td style="padding:0 0 24px">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em">Active challenges for you</p>
${freshBlocks}
</td></tr>
<tr><td style="padding:16px 0;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;line-height:1.5">
<p style="margin:0 0 8px">Reply to this email to unsubscribe from weekly digests.</p>
<p style="margin:0"><a href="${escapeHtml(base)}" style="color:#6366F1;text-decoration:none">${escapeHtml(base)}</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
    await resend.send({
      from,
      to: u.email,
      subject: `Your HackaDevs week — rank #${rankLabel}, ${diffLabel(delta)} rep`,
      html,
      kind: 'weekly_digest',
    })
  }
}
