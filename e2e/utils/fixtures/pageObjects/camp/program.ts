import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export class CampProgram {
  constructor(
    private readonly _page: Page,
    private readonly _campId: string,
    private readonly _periodDescription: string
  ) {}

  @boxedStep
  async goto() {
    await this._page.goto(`/camps/${this._campId}/program`)
    await this._page.locator('.ec-period-switcher__button').click()
    await this._page
      .locator('.v-overlay--active .v-list-item')
      .filter({ hasText: this._periodDescription })
      .click()
    await expect(this._page.locator('.fab--bottom_nav')).toBeVisible()
    return this
  }

  @boxedStep
  async createActivity(title: string) {
    await this._page.locator('.fab--bottom_nav').click()
    const dialog = this._page.locator('.v-overlay--active')
    await dialog.getByLabel('Titel').fill(title)
    // The category field is only shown when the camp has categories
    const categorySelect = dialog
      .getByRole('combobox')
      .filter({ hasText: 'Block-Kategorie' })
    if (await categorySelect.count()) {
      await categorySelect.click()
      await this._page.locator('.v-overlay--active').getByRole('option').first().click()
    }
    await dialog.getByRole('button', { name: /Erstellen/i }).click()
    await expect(dialog).toBeHidden()
    return this
  }
}
