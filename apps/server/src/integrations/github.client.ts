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

  async function getContributionGraph(fromIso: string, toIso: string) {
    const { login } = await getViewerLogin()
    const raw = await getContributionGraphSummary(login, fromIso, toIso)
    const body = raw as {
      data?: {
        user?: {
          contributionsCollection?: {
            contributionCalendar?: {
              totalContributions: number
              weeks: { contributionDays: { date: string; contributionCount: number }[] }[]
            }
          }
        }
      }
    }
    const cal = body.data?.user?.contributionsCollection?.contributionCalendar
    if (!cal) {
      return { totalContributions: 0, weeks: [] as { days: { date: string; count: number }[] }[] }
    }
    return {
      totalContributions: cal.totalContributions,
      weeks: (cal.weeks ?? []).map((w) => ({
        days: (w.contributionDays ?? []).map((d) => ({
          date: d.date,
          count: d.contributionCount,
        })),
      })),
    }
  }

  return { getViewerLogin, getContributionGraphSummary, getContributionGraph }
}
