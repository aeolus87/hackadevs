import { TopBar } from '@/components/layout/top-bar'

export function AppChrome() {
  return (
    <div className="sticky top-0 z-30 flex min-h-[4.25rem] w-full items-stretch bg-hd-page/85 bg-gradient-to-b from-indigo-500/[0.07] via-hd-page/90 to-hd-page/95 backdrop-blur-xl md:ml-[232px] md:w-[calc(100%-232px)]">
      <TopBar />
    </div>
  )
}
