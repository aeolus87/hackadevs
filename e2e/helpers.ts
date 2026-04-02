import { platform } from 'node:process'
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export const AUTH_STORAGE_KEY = 'hackadevs.auth'

const ONBOARDING_DONE_KEY = 'hackadevs-onboarding-done'

const SELECT_ALL = platform === 'darwin' ? 'Meta+A' : 'Control+A'

export const SUM_POSITIVE_JS = `export function solve(input) {
  const nums = JSON.parse(input)
  let s = 0
  for (const n of nums) if (n > 0) s += n
  return String(s)
}
`

export type TestAccount = {
  username: string
  email: string
  password: string
}

export function uniqueAccount(prefix = 'e2e'): TestAccount {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  return {
    username: `${prefix}_${id}`,
    email: `${prefix}.${id}@example.com`,
    password: 'E2ETestPass1234',
  }
}

export async function registerAccount(
  page: Page,
  account: TestAccount,
  returnTo: string,
  displayName = 'E2E User',
) {
  await page.goto(`/register?returnTo=${encodeURIComponent(returnTo)}`)
  await page.locator('#register-display').fill(displayName)
  await page.locator('#register-username').fill(account.username)
  await page.locator('#register-email').fill(account.email)
  await page.locator('#register-password').fill(account.password)
  await page.evaluate((key) => {
    localStorage.setItem(key, '1')
  }, ONBOARDING_DONE_KEY)
  await page.getByRole('button', { name: /create account/i }).click()
}

export async function clearWebAuth(page: Page) {
  await page.evaluate((key) => {
    localStorage.removeItem(key)
  }, AUTH_STORAGE_KEY)
}

export async function loginAccount(page: Page, account: TestAccount, returnTo?: string) {
  const q = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''
  await page.goto(`/login${q}`)
  await page.locator('#login-email').fill(account.email)
  await page.locator('#login-password').fill(account.password)
  await page.getByRole('button', { name: /^sign in$/i }).click()
}

export async function selectSubmitLanguage(page: Page, label: 'JavaScript' | 'TypeScript') {
  await page.getByRole('button', { name: 'Language' }).click()
  await page.getByRole('option', { name: label }).click()
}

export async function fillSubmitPageSolution(page: Page, code: string, rationaleMinChars = 110) {
  await selectSubmitLanguage(page, 'JavaScript')

  const editor = page.locator('.cm-content')
  await editor.click()
  await page.keyboard.press(SELECT_ALL)
  await page.keyboard.press('Backspace')
  await page.keyboard.insertText(code)

  const block = 'x'.repeat(rationaleMinChars)
  await page.locator('textarea').first().fill(block)

  await expect
    .poll(
      async () => {
        const t = await page.getByTestId('submit-draft-status').textContent()
        return t ?? ''
      },
      { timeout: 20_000 },
    )
    .toMatch(/Last saved|Draft on your account/i)
}

export async function runTestsAndExpectAllPassed(page: Page) {
  await page.getByRole('button', { name: /run tests/i }).click()
  await expect(page.getByTestId('solution-all-tests-passed')).toBeVisible({
    timeout: 120_000,
  })
  await expect(page.getByRole('button', { name: /submit solution/i })).toBeEnabled({
    timeout: 15_000,
  })
}

export async function completeVerificationAndPublish(page: Page) {
  await expect(page.getByText(/two short answers/i)).toBeVisible({ timeout: 60_000 })
  const boxes = page.locator('[id^="fu-"]')
  const n = await boxes.count()
  for (let i = 0; i < n; i++) {
    await boxes.nth(i).fill('This is my detailed verification answer for the prompt above.')
  }
  await page.getByRole('button', { name: /publish solution/i }).click()
}

export async function stubSubmissionRunAllVisiblePassed(page: Page) {
  await page.route('**/api/v1/submissions/*/run', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          results: [
            { passed: true, stdout: '5', stderr: null, executionTimeMs: 1, memoryUsedMb: 0.1 },
            { passed: true, stdout: '0', stderr: null, executionTimeMs: 1, memoryUsedMb: 0.1 },
            { passed: true, stdout: '10', stderr: null, executionTimeMs: 1, memoryUsedMb: 0.1 },
          ],
          executionTimeMs: 3,
          testScore: 100,
        },
      }),
    })
  })
}

export const PROMPT8_SMOKE_CHECKLIST = [
  'Guest Start solving → /login with returnTo → after login lands on /challenge/:slug/submit',
  'Submit → AWAITING_VERIFICATION → VerificationModal → verify → solution viewer',
  'Published on ACTIVE challenge → STATE 5 banner → Withdraw → submit page → new draft saves',
  'POST /admin/challenges/:id/close → CLOSED + ranks + RANK_CHANGE notifications',
  'PATCH admin challenge ARCHIVED from CLOSED → row updates',
  'POST /portal/register → hackadevs.portal → pending approval when isApproved false',
  'Portal approved → dashboard lists challenges and bookmarks',
  'GET /submissions/challenge/:id/stats → language distribution with published subs',
] as const

/** Steps 1–37 complete = platform is launch-ready. Post-launch polish: comment threads, AST copy detection, hover cards, analytics dashboard UI. */
export const BETA_SMOKE_CHECKLIST = [
  '1. Register new account (email path) — lands on feed or returnTo',
  '2. Log out; log in again — session persists',
  '3. Feed loads: streak strip, challenge cards, no console errors',
  '4. Challenges catalog — switch category tab, open a challenge',
  '5. Challenge detail — spec, voting pill, submission stats area loads',
  '6. Guest: Start solving → /login?returnTo=…/submit — sign in → submit page',
  '7. Guest: View solutions → /login?returnTo=…/solutions — sign in → solutions list',
  '8. Draft autosave — edit code, wait for last-saved, refresh still has draft',
  '9. Run tests (Judge0) — visible cases pass; score ≥50% for publish path',
  '10. Rationale ≥100 chars — submit blocked until valid',
  '11. Submit solution — API returns AWAITING_VERIFICATION + 2 questions',
  '12. Verification modal — two answers 50–500 chars — POST /verify — PUBLISHED',
  '13. Redirect to solution viewer — code + scores visible',
  '14. Challenge detail banner — published / live state + scores',
  '15. Solutions browser lists published entry; spotlight updates',
  '16. Leaderboard / profile — rep or tier reflects after close (if applicable)',
  '17. Withdraw to revise (ACTIVE, before closesAt) — rep revoked — WITHDRAWN → new DRAFT save',
  '18. Notifications — bell count, mark read',
  '19. Settings — profile fields save',
  '20. Admin: open /admin/challenges — tabs, row actions',
  '21. Admin: publish draft / schedule / delete draft (as ADMIN)',
  '22. Admin: close ACTIVE challenge — CLOSED, preliminary ranks, RANK_CHANGE',
  '23. Admin: archive CLOSED challenge — ARCHIVED row',
  '24. Moderator: amber notice; Generate/Publish/Delete disabled',
  '25. Company portal: register — credentials screen — dashboard pending if not approved',
  '26. Portal: after approval — challenges + bookmarks sections load',
  '27. GET /submissions/challenge/:id/stats — language distribution with ≥1 published',
  '28. GitHub OAuth: Continue with GitHub — callback + hackadevs.returnTo — lands intended page',
  '29. GET /admin/portals → returns pending portals list',
  '30. PATCH /admin/portals/:id/approve → isVerified=true, approval email sent via Resend',
  '31. PATCH /admin/portals/:id/reject → rejectedAt set, rejection email sent',
  '32. After portal approved → /portal/dashboard shows challenge list (not pending screen)',
  '33. POST /users/me/avatar with valid image/jpeg contentType → returns { uploadUrl, publicUrl }',
  '34. PUT to uploadUrl with file binary → 200 from S3/R2',
  '35. PATCH /users/me with avatarUrl → user.avatarUrl updated, appears in GET /users/me',
  '36. streakAtRisk job: manually trigger with a user who has streak>7 and no submission today → Resend receives the email request (check Resend dashboard or test mode)',
  '37. weeklyDigest job: manually trigger → Resend receives real HTML email (not placeholder)',
] as const
