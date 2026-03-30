export type GitHubContributionDay = {
  date: string
  count: number
}

export function createGitHubClient(accessToken: string) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  async function getViewerLogin() {
    const res = await fetch('https://api.github.com/user', { headers })
    if (!res.ok) throw new Error(`GitHub user: ${res.status}`)
    return (await res.json()) as { login: string }
  }

  async function getContributionGraphSummary(login: string, from: string, to: string) {
    const query = `
      query($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
          }
        }
      }`
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables: { login, from, to } }),
    })
    if (!res.ok) throw new Error(`GitHub GraphQL: ${res.status}`)
    return (await res.json()) as unknown
  }

  return { getViewerLogin, getContributionGraphSummary }
}
