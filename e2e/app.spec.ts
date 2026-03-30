import { test, expect } from '@playwright/test'

test('feed loads', async ({ page }) => {
  await page.goto('/feed')
  await expect(page.getByTestId('feed-root')).toBeVisible()
})
