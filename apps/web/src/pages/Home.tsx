import { appMeta } from '@aeokit-webapp/core'
import { useApiHealth } from '@/hooks/use-api-health'

export default function Home() {
  const apiHealthy = useApiHealth()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 bg-neutral-950 text-neutral-100 p-8"
      data-testid="home-root"
    >
      <h1 className="text-3xl font-semibold tracking-tight" data-testid="home-title">
        {appMeta.name}
      </h1>
      <p className="text-neutral-400 text-center max-w-md" data-testid="home-blurb">
        Monorepo skeleton — add pages, API routes, and packages as you go.
      </p>
      <p className="text-sm text-neutral-500" data-testid="home-api-health">
        {apiHealthy === null && 'API: …'}
        {apiHealthy === true && 'API: ok'}
        {apiHealthy === false && 'API: unreachable'}
      </p>
    </div>
  )
}
