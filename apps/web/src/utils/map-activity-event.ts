import type { ActivityEvent } from '@/types/hackadevs-api.types'
import type { ActivityItem, ActivityKind } from '@/types/hackadevs'

function eventKind(type: string): ActivityKind | undefined {
  if (type === 'submission') return 'solve'
  if (type === 'follow') return 'follow'
  if (type === 'badge') return 'badge'
  return undefined
}

function stableId(ev: ActivityEvent, index: number): string {
  const m = ev.meta
  if (m && typeof m === 'object') {
    const sub = (m as { submissionId?: string }).submissionId
    if (typeof sub === 'string') return `submission-${sub}`
    const bid = (m as { badgeType?: string }).badgeType
    if (typeof bid === 'string') return `badge-${bid}-${ev.createdAt}`
    const fid = (m as { followerId?: string }).followerId
    if (typeof fid === 'string') return `follow-${fid}-${ev.createdAt}`
  }
  return `${ev.type}-${ev.createdAt}-${index}`
}

export function activityEventToUiItem(ev: ActivityEvent, index: number): ActivityItem {
  const d = new Date(ev.createdAt)
  const time = Number.isNaN(d.getTime())
    ? ev.createdAt
    : d.toLocaleString(undefined, { dateStyle: 'medium' })
  return {
    id: stableId(ev, index),
    text: ev.summary,
    time,
    kind: eventKind(ev.type),
  }
}
