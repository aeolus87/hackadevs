import { test, expect } from '@playwright/test'
import {
  SUM_POSITIVE_JS,
  uniqueAccount,
  registerAccount,
  fillSubmitPageSolution,
  runTestsAndExpectAllPassed,
  stubSubmissionRunAllVisiblePassed,
} from './helpers'

test.describe('authenticated core loop', () => {
  test.describe.configure({ timeout: 180_000 })

  test('register → draft → run tests (stubbed Judge0) → ready to submit', async ({ page }) => {
    await stubSubmissionRunAllVisiblePassed(page)

    const account = uniqueAccount()
    await registerAccount(page, account, `/challenge/sum-positive-numbers/submit`)

    await page.waitForURL(`**/challenge/sum-positive-numbers/submit`, { timeout: 30_000 })
    await expect(page.getByRole('link', { name: /sum positive numbers/i })).toBeVisible({
      timeout: 15_000,
    })

    await fillSubmitPageSolution(page, SUM_POSITIVE_JS)

    await expect
      .poll(async () => page.locator('.cm-content').innerText(), { timeout: 10_000 })
      .toContain('export function solve')

    await runTestsAndExpectAllPassed(page)
  })
})
