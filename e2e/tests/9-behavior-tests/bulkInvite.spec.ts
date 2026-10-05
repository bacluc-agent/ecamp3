import { APIRequestContext, expect, Page } from '@playwright/test'
import { test } from '@/utils/etest'
import { bipiUser, grgrCampId } from '@/utils/constants'
import { loginAndSetCookie } from '@/utils/helpers'
import { BulkInviteDialog } from '@/utils/fixtures/pageObjects/bulkInviteDialog'

test(
  'opens dialog and shows form fields',
  { tag: '@mature' },
  async ({ page, request }) => {
    await openCollaborators(page, request)
    const dialog = await new BulkInviteDialog(page).open()

    await expect(dialog.emailInput).toBeVisible()
    await expect(dialog.overlay.getByRole('combobox', { name: /Rolle/ })).toBeVisible()
    await expect(dialog.submitButton).toBeVisible()
    await expect(dialog.submitButton).toBeDisabled()
  }
)

test(
  'invites new people and shows success count',
  { tag: '@mature' },
  async ({ page, request, runId }) => {
    const email1 = `run${runId}-a@example.com`
    const email2 = `run${runId}-b@example.com`

    await openCollaborators(page, request)
    const dialog = await new BulkInviteDialog(page).open()
    await dialog.emailInput.fill(`${email1}\n${email2}`)
    await dialog.submitButton.click()
    await expect(dialog.overlay.locator('.v-alert')).toContainText('2')
    await dialog.close()

    await expect(page.getByText(email1, { exact: true })).toBeVisible()
    await expect(page.getByText(email2, { exact: true })).toBeVisible()
  }
)

test(
  'reports already-invited email in the result',
  { tag: '@mature' },
  async ({ page, request, runId }) => {
    const newEmail = `run${runId}-c@example.com`

    await openCollaborators(page, request)
    const dialog = await new BulkInviteDialog(page).open()
    await dialog.emailInput.fill(`x@z.com\n${newEmail}`)
    await dialog.submitButton.click()

    await expect(
      dialog.overlay.getByRole('alert').filter({ hasText: 'x@z.com' })
    ).toBeVisible()
  }
)

test(
  'shows failed email in the result when invite fails',
  { tag: '@mature' },
  async ({ page, request, runId }) => {
    const email1 = `run${runId}-d@example.com`
    const email2 = `run2${runId}-d@example.com`

    await openCollaborators(page, request)
    const dialog = await new BulkInviteDialog(page).open()
    await dialog.emailInput.fill(`${email1};${email2}`)

    await page.route('**/camp_collaborations', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 500, body: 'Internal Server Error' })
      } else {
        await route.continue()
      }
    })

    await dialog.submitButton.click()
    const failedAlert = dialog.overlay.getByRole('alert').filter({ hasText: email1 })
    await expect(failedAlert).toContainText(email1)
    await expect(failedAlert).toContainText(email2)
    await expect(
      dialog.overlay.getByRole('textbox', { name: 'E-Mail-Adressen' })
    ).toHaveValue(`${email1};${email2}`)
  }
)

test(
  'closes dialog and resets form on cancel',
  { tag: '@mature' },
  async ({ page, request }) => {
    await openCollaborators(page, request)
    const dialog = await new BulkInviteDialog(page).open()
    await dialog.emailInput.fill('test@example.com')
    await dialog.close()

    const reopenedDialog = await new BulkInviteDialog(page).open()
    await expect(reopenedDialog.emailInput).toHaveValue('')
  }
)

async function openCollaborators(page: Page, request: APIRequestContext) {
  await loginAndSetCookie(page, request, bipiUser)
  await expect(page.getByTestId('create-camp-button')).toBeVisible({ timeout: 60000 })
  await page.goto(`/camps/${grgrCampId}/GRGR/admin/collaborators`)
  await expect(
    page.getByRole('button', { name: 'Mehrere Personen einladen' })
  ).toBeVisible({ timeout: 20000 })
}
