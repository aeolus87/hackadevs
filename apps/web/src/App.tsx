import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/auth-context'
import { AppLayout } from '@/components/layout/app-layout'
import { OnboardingModal } from '@/components/onboarding-modal'
import { ToastProvider } from '@/contexts/toast-context'
import FeedPage from '@/pages/feed-page'
import ChallengesPage from '@/pages/challenges-page'
import ChallengeDetailPage from '@/pages/challenge-detail-page'
import SubmitSolutionPage from '@/pages/submit-solution-page'
import SolutionsBrowserPage from '@/pages/solutions-browser-page'
import LeaderboardPage from '@/pages/leaderboard-page'
import ProfilePage from '@/pages/profile-page'
import SolutionViewerPage from '@/pages/solution-viewer-page'
import SettingsPage from '@/pages/settings-page'
import LoginPage from '@/pages/login-page'
import RegisterPage from '@/pages/register-page'
import NotificationsPage from '@/pages/notifications-page'
import NotFoundPage from '@/pages/not-found-page'

function Shell({ children }: { children: ReactNode }) {
  return (
    <AppLayout>
      <OnboardingModal />
      {children}
    </AppLayout>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/feed"
              element={
                <Shell>
                  <FeedPage />
                </Shell>
              }
            />
            <Route
              path="/challenges"
              element={
                <Shell>
                  <ChallengesPage />
                </Shell>
              }
            />
            <Route
              path="/challenge/:slug"
              element={
                <Shell>
                  <ChallengeDetailPage />
                </Shell>
              }
            />
            <Route
              path="/challenge/:slug/submit"
              element={
                <Shell>
                  <SubmitSolutionPage />
                </Shell>
              }
            />
            <Route
              path="/challenge/:slug/solutions"
              element={
                <Shell>
                  <SolutionsBrowserPage />
                </Shell>
              }
            />
            <Route
              path="/challenge/:slug/solutions/:id"
              element={
                <Shell>
                  <SolutionViewerPage />
                </Shell>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <Shell>
                  <LeaderboardPage />
                </Shell>
              }
            />
            <Route
              path="/u/:username"
              element={
                <Shell>
                  <ProfilePage />
                </Shell>
              }
            />
            <Route
              path="/settings"
              element={
                <Shell>
                  <SettingsPage />
                </Shell>
              }
            />
            <Route
              path="/notifications"
              element={
                <Shell>
                  <NotificationsPage />
                </Shell>
              }
            />
            <Route
              path="*"
              element={
                <Shell>
                  <NotFoundPage />
                </Shell>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}
