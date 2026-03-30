import { test, expect } from '@playwright/test'

test('home loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('home-title')).toBeVisible()
  await expect(page.getByTestId('home-blurb')).toBeVisible()
})
