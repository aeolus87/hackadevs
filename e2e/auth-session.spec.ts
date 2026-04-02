import { test, expect } from '@playwright/test'
import { uniqueAccount, registerAccount, clearWebAuth, loginAccount } from './helpers'

test.describe('auth session', () => {
  test('register → clear session → sign in reaches feed', async ({ page }) => {
    const account = uniqueAccount('e2e_auth')
    await registerAccount(page, account, '/feed')

    await page.waitForURL(`**/feed`, { timeout: 30_000 })
    await expect(page.getByTestId('feed-root')).toBeVisible()

    await clearWebAuth(page)
    await loginAccount(page, account, '/feed')

    await page.waitForURL(`**/feed`, { timeout: 30_000 })
    await expect(page.getByTestId('feed-root')).toBeVisible()
  })
})
