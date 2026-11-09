import { expect, Locator } from '@playwright/test'
import { test } from '@/utils/etest'
import {
  bipiUser,
  bruceWayneUser as bruceWayneEmail,
  grgrCampId,
} from '@/utils/constants'
import { loginAndSetCookie } from '@/utils/helpers'
import { CampCollaborators } from '@/utils/fixtures/pageObjects/camp/admin/campCollaborators'
import { DialogCollaboratorInvite } from '@/utils/fixtures/pageObjects/camp/admin/dialogCollaboratorInvite'

test.describe('invite collaborator by searching profiles', () => {
  let dialog: Locator

  test.beforeEach(async ({ page, request }) => {
    await loginAndSetCookie(page, request, bipiUser)
    await page.goto(`/camps/${grgrCampId}/admin/collaborators`)
    await page.getByTestId('collaborator-invite-cta').click()
    dialog = page.getByTestId('collaborator-create-dialog')
    await expect(dialog).toBeVisible()
  })

  test('finds a related profile by name and uses its email', async ({ page }) => {
    const searchInput = page.locator('[data-testid="collaborator-invite-search"] input')
    await searchInput.fill('Bruce')

    const result = page
      .getByTestId('collaborator-invite-result')
      .filter({ hasText: bruceWayneEmail })
    await expect(result).toBeVisible({ timeout: 10000 })
    await expect(result).toContainText('Bruce Wayne')

    await result.click()

    await expect(searchInput).toHaveValue(bruceWayneEmail)

    await page.keyboard.press('Tab')

    const submitButton = dialog.locator('[type="submit"]')
    await submitButton.focus()
    await submitButton.click()

    await expect(page.getByText('BW')).toBeVisible()
    await expect(page.getByText('Bruce Wayne', { exact: true })).toBeVisible()
  })

  test('finds a related profile by part of the surname', async ({ page }) => {
    const searchInput = page.locator('[data-testid="collaborator-invite-search"] input')
    await searchInput.fill('müll')

    const result = page
      .getByTestId('collaborator-invite-result')
      .filter({ hasText: 'salamander@example.com' })
    await expect(result).toBeVisible({ timeout: 10000 })

    await result.click()
  })

  test(
    'allows typing a brand-new email address that is not a known profile',
    { tag: '@mature' },
    async ({ page }) => {
      const searchInput = page.locator('[data-testid="collaborator-invite-search"] input')
      await searchInput.fill('someone-new@example.com')

      await expect(
        page.getByTestId('collaborator-invite-result').filter({ hasText: '@' })
      ).toHaveCount(0)
      await searchInput.blur()
      await expect(searchInput).toHaveValue('someone-new@example.com')
    }
  )
})

test.describe('invite collaborator by searching profiles via page objects', () => {
  let collaborators: CampCollaborators
  let dialog: DialogCollaboratorInvite

  test.beforeEach(async ({ loginPage, campCollaborators }) => {
    await loginPage.open()
    await loginPage.loginToCampList(bipiUser)
    collaborators = await campCollaborators.goto()
    dialog = await collaborators.openInviteDialog()
  })

  test('finds a related profile by name and invites it via page objects', async () => {
    await dialog.searchProfiles('Bruce')
    await expect(dialog.result(bruceWayneEmail)).toBeVisible({ timeout: 10000 })
    await expect(dialog.result(bruceWayneEmail)).toContainText('Bruce Wayne')
    await dialog.selectResult(bruceWayneEmail)
    await expect(dialog.searchInput).toHaveValue(bruceWayneEmail)

    await dialog.submit()

    await expect(collaborators.collaboratorList.getByText('BW')).toBeVisible()
    await expect(
      collaborators.collaboratorList.getByText('Bruce Wayne', { exact: true })
    ).toBeVisible()
  })

  test('finds a related profile by part of the surname via page objects', async () => {
    await dialog.searchProfiles('müll')
    await expect(dialog.result('salamander@example.com')).toBeVisible({
      timeout: 10000,
    })
    await dialog.selectResult('salamander@example.com')
  })

  test('allows an unknown email that is no profile via page objects', async () => {
    await dialog.searchProfiles('someone-new@example.com')
    await expect(dialog.result('@')).toHaveCount(0)
    await dialog.blurSearch()
    await expect(dialog.searchInput).toHaveValue('someone-new@example.com')
  })
})
