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
  ME_ACTIVITY: () => `${V1}/users/me/activity`,
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

export const SUBMISSIONS = {
  CREATE: () => `${V1}/submissions`,
  RUN: (id: string) => `${V1}/submissions/${encodeURIComponent(id)}/run`,
  SUBMIT: (id: string) => `${V1}/submissions/${encodeURIComponent(id)}/submit`,
  GET: (id: string) => `${V1}/submissions/${encodeURIComponent(id)}`,
  BY_CHALLENGE: (challengeId: string) =>
    `${V1}/submissions/challenge/${encodeURIComponent(challengeId)}`,
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
