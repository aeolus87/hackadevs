import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/auth-context'
import { ToastProvider } from '@/contexts/toast-context'
import FeedPage from '@/pages/feed-page'

describe('FeedPage', () => {
  it('renders feed layout', () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <FeedPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('feed-root')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'This week' })).toBeTruthy()
  })
})
