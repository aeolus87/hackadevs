import type { ReactNode } from 'react'
import { useMe } from '@/hooks/users/useMe'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'

export function AppLayout({ children }: { children: ReactNode }) {
  useMe()
  return (
    <div className="min-h-screen bg-hd-page text-hd-text">
      <Sidebar />
      <div className="md:pl-[220px]">
        <TopBar />
        <main className="px-4 pb-24 pt-6 md:pb-10">{children}</main>
      </div>
      <MobileTabBar />
    </div>
  )
}
