import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { DialogCollaboratorBulkInvite } from '@/utils/fixtures/pageObjects/camp/admin/dialogCollaboratorBulkInvite'

export class CampCollaboratorsPage {
  static readonly ROUTE = '/admin/collaborators'

  constructor(
    private readonly _page: Page,
    private readonly _campId: string,
    private readonly _bulkInviteCta = _page.getByRole('button', {
      name: 'Mehrere Personen einladen',
    })
  ) {}

  @boxedStep
  async goto() {
    // The `/GRGR` short-title segment of the camp route is optional
    // (frontend/src/router.js), so the camp id alone is enough.
    await this._page.goto(`/camps/${this._campId}${CampCollaboratorsPage.ROUTE}`)
    return this.loaded()
  }

  @boxedStep
  async loaded() {
    // The CTA only renders once the camp collaborations are loaded, so it is the
    // gate that means "the page is usable".
    await expect(this._bulkInviteCta).toBeVisible({ timeout: 20000 })
    return this
  }

  @boxedStep
  async openBulkInviteDialog() {
    await this._bulkInviteCta.click()
    const dialog = new DialogCollaboratorBulkInvite(this._page)
    await dialog.loaded()
    return dialog
  }
}
