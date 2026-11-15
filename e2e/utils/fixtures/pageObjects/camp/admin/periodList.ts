import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { DialogDeletePeriod } from '@/utils/fixtures/pageObjects/camp/admin/dialogDeletePeriod'

export class PeriodList {
  constructor(
    private readonly _page: Page,
    private readonly _campId: string,
    private readonly _createButton = _page.getByRole('button', {
      name: /Lagerabschnitt erstellen/i,
    })
  ) {}

  @boxedStep
  async goto() {
    await this._page.goto(`/camps/${this._campId}/admin/info`)
    await expect(this._createButton).toBeVisible()
    return this
  }

  private period(description: string) {
    return this._page
      .getByText(description, { exact: true })
      .locator('xpath=ancestor::*[contains(@class, "v-list-item")][1]')
  }

  @boxedStep
  async create(description: string, start: string, end: string) {
    await this._createButton.click()
    const dialog = this._page.locator('.v-overlay--active')
    await dialog.getByLabel('Beschreibung').fill(description)
    await dialog.getByLabel('Von').fill(start)
    await dialog.getByLabel('Bis').fill(end)
    await dialog.getByRole('button', { name: /Erstellen/i }).click()
    await expect(this.period(description)).toBeVisible()
    return this
  }

  @boxedStep
  async openDelete(description: string) {
    const item = this.period(description)
    await item.getByRole('button').click()
    await this._page
      .locator('.v-overlay--active')
      .getByText('Löschen', { exact: true })
      .click()
    const dialog = new DialogDeletePeriod(this._page)
    await dialog.loaded()
    return dialog
  }

  async expectVisible(description: string) {
    await expect(this.period(description)).toBeVisible()
    return this
  }

  async expectHidden(description: string) {
    await expect(this.period(description)).toBeHidden()
    return this
  }
}
