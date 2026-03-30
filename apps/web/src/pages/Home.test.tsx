import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Home from '@/pages/Home'

vi.mock('@/utils/axios.instance', () => ({
  axiosInstance: {
    get: vi.fn(() =>
      Promise.resolve({ data: { status: 'ok' as const, timestamp: new Date().toISOString() } }),
    ),
  },
}))

describe('Home', () => {
  it('renders title and blurb and shows API ok when health succeeds', async () => {
    render(<Home />)
    expect(screen.getAllByTestId('home-title')[0].textContent).toBe('aeokit-webapp')
    expect(screen.getAllByTestId('home-blurb')[0]).toBeTruthy()
    await waitFor(() => {
      const lines = screen.getAllByTestId('home-api-health')
      expect(lines.some((el) => el.textContent?.includes('API: ok'))).toBe(true)
    })
  })
})
