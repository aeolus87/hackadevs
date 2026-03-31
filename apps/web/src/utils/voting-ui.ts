export type VotingState = 'active' | 'voting_open' | 'voting_closed' | 'results_final'

export function getVotingState(closesAt: string, votingSettled?: boolean): VotingState {
  const now = Date.now()
  const closedAt = new Date(closesAt).getTime()
  const votingOpenUntil = closedAt + 48 * 60 * 60 * 1000
  if (now < closedAt) return 'active'
  if (now < votingOpenUntil) return 'voting_open'
  if (!votingSettled) return 'voting_closed'
  return 'results_final'
}

export function votingPhaseRelativeSuffix(state: VotingState, closesAt: string): string {
  const close = new Date(closesAt).getTime()
  const voteEnd = close + 48 * 60 * 60 * 1000
  const target = state === 'active' ? close : state === 'voting_open' ? voteEnd : Date.now()
  const ms = target - Date.now()
  if (ms <= 0) return 'soon'
  const h = Math.floor(ms / 3600000)
  if (h < 48) return `${Math.max(1, h)}h`
  return `${Math.ceil(ms / 86400000)}d`
}

export function votingPhaseLabel(state: VotingState, closesAt: string): string {
  if (state === 'active') {
    return `Accepting solutions · closes in ${votingPhaseRelativeSuffix(state, closesAt)}`
  }
  if (state === 'voting_open') {
    return `Voting open · closes in ${votingPhaseRelativeSuffix(state, closesAt)}`
  }
  if (state === 'voting_closed') return 'Finalising results'
  return 'Results final'
}
