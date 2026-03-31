import type { ReactNode } from 'react'
import { useMe } from '@/hooks/users/useMe'
import { AppChrome } from '@/components/layout/app-chrome'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'

export function AppLayout({ children }: { children: ReactNode }) {
  useMe()
  return (
    <div className="min-h-screen bg-hd-page text-hd-text">
      <AppChrome />
      <Sidebar />
      <div className="md:pl-[232px]">
        <main className="px-4 pb-24 pt-6 md:pb-10">{children}</main>
      </div>
      <MobileTabBar />
    </div>
  )
}
