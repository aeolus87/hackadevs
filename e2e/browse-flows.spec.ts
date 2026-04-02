import { test, expect } from '@playwright/test'

test.describe('browse flows', () => {
  test('challenge catalog: switch category and open a challenge', async ({ page }) => {
    await page.goto('/challenges')
    await expect(page.getByRole('heading', { name: /^challenge catalog$/i })).toBeVisible()

    await page.getByRole('button', { name: 'Backend' }).click()

    const link = page.getByRole('link', { name: /sum positive numbers/i }).first()
    await expect(link).toBeVisible({ timeout: 20_000 })
    await link.click()

    await page.waitForURL(`**/challenge/sum-positive-numbers`, { timeout: 15_000 })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('challenge detail → View solutions gates guests to login with returnTo', async ({
    page,
  }) => {
    await page.goto('/challenge/sum-positive-numbers')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('link', { name: /view solutions/i }).click()
    await page.waitForURL(/\/login\?returnTo=/, { timeout: 15_000 })
    const url = new URL(page.url())
    expect(url.searchParams.get('returnTo')).toContain('/challenge/sum-positive-numbers/solutions')
  })

  test('feed → open first challenge from discovery cards', async ({ page }) => {
    await page.goto('/feed')
    await expect(page.getByTestId('feed-root')).toBeVisible()

    const firstChallenge = page.locator('main a[href^="/challenge/"]').first()
    await expect(firstChallenge).toBeVisible({ timeout: 20_000 })
    await firstChallenge.click()

    await expect(page).toHaveURL(/\/challenge\/[^/]+$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
