import { test, expect } from '@playwright/test'

const SUM_POSITIVE_CODE = `export function solve(input: string): string {
  const nums = JSON.parse(input) as number[]
  let s = 0
  for (const n of nums) if (n > 0) s += n
  return String(s)
}
`

test.describe('authenticated core loop', () => {
  test.describe.configure({ timeout: 180_000 })

  test('register → submit flow (draft, run tests, submit)', async ({ page }) => {
    const id = `${Date.now()}`
    const username = `e2e_${id}`
    const email = `e2e.${id}@example.com`
    const password = 'E2ETestPass1234'
    const returnTo = `/challenge/sum-positive-numbers/submit`

    await page.goto(`/register?returnTo=${encodeURIComponent(returnTo)}`)

    await page.locator('#register-display').fill('E2E User')
    await page.locator('#register-username').fill(username)
    await page.locator('#register-email').fill(email)
    await page.locator('#register-password').fill(password)

    await page.getByRole('button', { name: /create account/i }).click()

    await page.waitForURL(`**/challenge/sum-positive-numbers/submit`, { timeout: 30_000 })
    await expect(page.getByRole('link', { name: /sum-positive/i })).toBeVisible({ timeout: 15_000 })

    const editor = page.locator('.cm-content')
    await editor.click()
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Backspace')
    await page.keyboard.insertText(SUM_POSITIVE_CODE)

    const rationaleBlock = 'x'.repeat(110)
    await page.locator('textarea').first().fill(rationaleBlock)

    await page.waitForTimeout(6000)

    await page.getByRole('button', { name: /run tests/i }).click()

    await expect(page.getByText(/all tests passed|some tests failed/i)).toBeVisible({
      timeout: 120_000,
    })

    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: /submit solution/i }).click()

    await page.waitForURL(`**/challenge/sum-positive-numbers/solutions/**`, { timeout: 60_000 })
  })
})
