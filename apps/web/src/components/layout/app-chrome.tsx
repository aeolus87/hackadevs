import { HackaDevsMark } from '@/components/layout/hackadevs-mark'
import { TopBar } from '@/components/layout/top-bar'

export function AppChrome() {
  return (
    <div className="sticky top-0 z-30 flex w-full min-h-14 items-stretch border-b border-hd-border/50 bg-hd-page/85 bg-gradient-to-b from-indigo-500/[0.07] via-hd-page/90 to-hd-page/95 backdrop-blur-xl">
      <div className="hidden w-[232px] shrink-0 items-center gap-3 border-r border-hd-border/80 bg-hd-surface/95 px-3 py-2.5 sm:px-4 md:flex">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-hd-text">
          <HackaDevsMark className="h-7 w-7" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-hd-text">HackaDevs</span>
      </div>
      <TopBar />
    </div>
  )
}
