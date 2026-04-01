export type PortalCompanyChallenge = {
  id: string
  portalId: string
  rawProblem: string
  sanitisedProblem: string | null
  status: 'PENDING' | 'SANITISING' | 'APPROVED' | 'REJECTED'
  challengeId: string | null
  createdAt: string
  updatedAt: string
}

export type PortalBookmarkRow = {
  id: string
  portalId: string
  userId: string
  submissionId: string
  notifiedUser: boolean
  createdAt: string
  updatedAt: string
  submission: {
    user: { username: string; displayName: string }
    challenge: { title: string; slug: string }
  }
}
