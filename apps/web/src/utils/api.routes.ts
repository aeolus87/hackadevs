const raw = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export const BASE_URL = raw.replace(/\/$/, '')

export const SOCKET_SERVER = BASE_URL.replace(/\/api\/?$/, '')

const V1 = '/v1'

export const HEALTH = () => '/health'

export const AUTH = {
  REGISTER: () => `${V1}/auth/register`,
  LOGIN: () => `${V1}/auth/login`,
  GITHUB: () => `${V1}/auth/github`,
  REFRESH: () => `${V1}/auth/refresh`,
  LOGOUT: () => `${V1}/auth/logout`,
}

export const USERS = {
  ME: () => `${V1}/users/me`,
  AVATAR: () => `${V1}/users/me/avatar`,
  ME_ACTIVITY: () => `${V1}/users/me/activity`,
  PROFILE_ACTIVITY: (username: string) => `${V1}/users/${encodeURIComponent(username)}/activity`,
  PROFILE: (username: string) => `${V1}/users/${encodeURIComponent(username)}`,
  SOLUTIONS: (username: string) => `${V1}/users/${encodeURIComponent(username)}/solutions`,
  FOLLOWERS: (username: string) => `${V1}/users/${encodeURIComponent(username)}/followers`,
  FOLLOWING: (username: string) => `${V1}/users/${encodeURIComponent(username)}/following`,
  PIN: (submissionId: string) => `${V1}/users/me/pin/${encodeURIComponent(submissionId)}`,
  UNPIN: (submissionId: string) => `${V1}/users/me/pin/${encodeURIComponent(submissionId)}`,
}

export const CHALLENGES = {
  LIST: () => `${V1}/challenges`,
  ACTIVE: () => `${V1}/challenges/active`,
  DETAIL: (slug: string) => `${V1}/challenges/${encodeURIComponent(slug)}`,
  LEADERBOARD: (slug: string) => `${V1}/challenges/${encodeURIComponent(slug)}/leaderboard`,
}

export const SEARCH = (params: { q: string; limitChallenges?: number; limitUsers?: number }) => {
  const sp = new URLSearchParams()
  sp.set('q', params.q)
  if (params.limitChallenges != null) sp.set('limitChallenges', String(params.limitChallenges))
  if (params.limitUsers != null) sp.set('limitUsers', String(params.limitUsers))
  return `${V1}/search?${sp.toString()}`
}

export const SUBMISSIONS = {
  CREATE: () => `${V1}/submissions`,
  RUN: (id: string) => `${V1}/submissions/${encodeURIComponent(id)}/run`,
  SUBMIT: (id: string) => `${V1}/submissions/${encodeURIComponent(id)}/submit`,
  RESUME_FOLLOWUP: (id: string) => `${V1}/submissions/${encodeURIComponent(id)}/resume-followup`,
  WITHDRAW_FOR_REVISION: (id: string) =>
    `${V1}/submissions/${encodeURIComponent(id)}/withdraw-for-revision`,
  FOLLOW_UP: (id: string) => `${V1}/submissions/${encodeURIComponent(id)}/follow-up`,
  GET: (id: string) => `${V1}/submissions/${encodeURIComponent(id)}`,
  MINE_BY_CHALLENGE: (challengeId: string) =>
    `${V1}/submissions/mine/challenge/${encodeURIComponent(challengeId)}`,
  BY_CHALLENGE: (challengeId: string) =>
    `${V1}/submissions/challenge/${encodeURIComponent(challengeId)}`,
  STATS: (challengeId: string) =>
    `${V1}/submissions/challenge/${encodeURIComponent(challengeId)}/stats`,
  VERIFY: (id: string) => `${V1}/submissions/${encodeURIComponent(id)}/verify`,
  WITHDRAW: (id: string) => `${V1}/submissions/${encodeURIComponent(id)}`,
}

export const VOTES = {
  CAST: () => `${V1}/votes`,
  RETRACT: (submissionId: string) => `${V1}/votes/${encodeURIComponent(submissionId)}`,
  COUNTS: (submissionId: string) => `${V1}/votes/submission/${encodeURIComponent(submissionId)}`,
}

export const LEADERBOARD = {
  GLOBAL: () => `${V1}/leaderboard/global`,
  CATEGORY: (category: string) => `${V1}/leaderboard/category/${encodeURIComponent(category)}`,
  FRIENDS: () => `${V1}/leaderboard/friends`,
  MY_RANK: () => `${V1}/leaderboard/me/rank`,
}

export const FOLLOWS = {
  FOLLOW: (username: string) => `${V1}/follows/${encodeURIComponent(username)}`,
  UNFOLLOW: (username: string) => `${V1}/follows/${encodeURIComponent(username)}`,
}

export const NOTIFICATIONS = {
  LIST: () => `${V1}/notifications`,
  MARK_READ: (id: string) => `${V1}/notifications/${encodeURIComponent(id)}/read`,
  MARK_ALL_READ: () => `${V1}/notifications/read-all`,
}

export const ADMIN = {
  CHALLENGES: () => `${V1}/admin/challenges`,
  CHALLENGE: (id: string) => `${V1}/admin/challenges/${encodeURIComponent(id)}`,
  PUBLISH: (id: string) => `${V1}/admin/challenges/${encodeURIComponent(id)}/publish`,
  CLOSE: (id: string) => `${V1}/admin/challenges/${encodeURIComponent(id)}/close`,
  GENERATE: () => `${V1}/admin/challenges/generate`,
  PORTALS: (params?: {
    status?: 'pending' | 'approved' | 'all'
    page?: number
    limit?: number
  }) => {
    const sp = new URLSearchParams()
    if (params?.status) sp.set('status', params.status)
    if (params?.page != null) sp.set('page', String(params.page))
    if (params?.limit != null) sp.set('limit', String(params.limit))
    const q = sp.toString()
    return q ? `${V1}/admin/portals?${q}` : `${V1}/admin/portals`
  },
  PORTAL: (id: string) => `${V1}/admin/portals/${encodeURIComponent(id)}`,
  PORTAL_APPROVE: (id: string) => `${V1}/admin/portals/${encodeURIComponent(id)}/approve`,
  PORTAL_REJECT: (id: string) => `${V1}/admin/portals/${encodeURIComponent(id)}/reject`,
}

export const PORTAL = {
  REGISTER: () => `${V1}/portal/register`,
  CHALLENGES: () => `${V1}/portal/challenges`,
  BOOKMARK: (submissionId: string) => `${V1}/portal/bookmark/${encodeURIComponent(submissionId)}`,
  BOOKMARKS: () => `${V1}/portal/bookmarks`,
}
