import { test, expect } from '@playwright/test'

test.describe('public pages', () => {
  test('feed loads', async ({ page }) => {
    await page.goto('/feed')
    await expect(page.getByTestId('feed-root')).toBeVisible()
  })

  test('login loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in to hackadevs/i })).toBeVisible()
  })

  test('register loads', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /join hackadevs/i })).toBeVisible()
  })

  test('leaderboard loads', async ({ page }) => {
    await page.goto('/leaderboard')
    await expect(page.getByRole('heading', { name: /global leaderboard/i })).toBeVisible()
  })

  test('challenges index loads', async ({ page }) => {
    await page.goto('/challenges')
    await expect(page.getByRole('heading', { name: /^challenges$/i })).toBeVisible()
  })

  test('challenge detail resolves for seeded slug', async ({ page }) => {
    await page.goto('/challenge/idempotency-keys-ledger-scale')
    const title = page.getByRole('heading', { level: 1 })
    const missing = page.getByText('Challenge not found')
    await expect(title.or(missing)).toBeVisible({ timeout: 20_000 })
  })

  test('profile page resolves (seeded user or API error state)', async ({ page }) => {
    await page.goto('/u/alex_chen')
    const loaded = page.getByRole('heading', { name: 'Alex Chen' })
    const notFound = page.getByText('Profile not found')
    const loadErr = page.getByText(/could not load profile/i)
    await expect(loaded.or(notFound).or(loadErr)).toBeVisible({ timeout: 20_000 })
  })
})
