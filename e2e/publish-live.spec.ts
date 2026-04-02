import { test, expect } from '@playwright/test'
import {
  SUM_POSITIVE_JS,
  uniqueAccount,
  registerAccount,
  fillSubmitPageSolution,
  runTestsAndExpectAllPassed,
  completeVerificationAndPublish,
} from './helpers'

test.describe('publish with live Judge0', () => {
  test.describe.configure({ timeout: 180_000 })

  test('full pipeline without stubbed run', async ({ page }) => {
    test.skip(
      !process.env.E2E_LIVE_PUBLISH,
      'Set E2E_LIVE_PUBLISH=1 with a working Judge0 reachable from the API',
    )

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

    await page.getByRole('button', { name: /submit solution/i }).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^submit$/i })
      .click()

    await completeVerificationAndPublish(page)

    await page.waitForURL(`**/challenge/sum-positive-numbers/solutions/**`, { timeout: 120_000 })
  })
})
