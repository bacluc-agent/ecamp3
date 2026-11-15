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
    const periodSwitcher = this._page
      .getByRole('button')
      .filter({ hasText: this._periodDescription })
    await periodSwitcher.click()
    await this._page
      .locator('.v-overlay--active')
      .getByRole('listitem')
      .filter({ hasText: this._periodDescription })
      .click()
    await expect(
      this._page.locator('button').filter({ has: this._page.locator('i.mdi-plus') })
    ).toBeVisible()
    return this
  }

  @boxedStep
  async createActivity(title: string) {
    await this._page
      .locator('button')
      .filter({ has: this._page.locator('i.mdi-plus') })
      .click()
    const dialog = this._page.locator('.v-overlay--active')
    await dialog.getByLabel('Titel').fill(title)
    await dialog.getByLabel('Block-Kategorie').click()
    await this._page.locator('.v-overlay--active').getByRole('option').first().click()
    await dialog.getByRole('button', { name: /Erstellen/i }).click()
    await expect(dialog).toBeHidden()
    return this
  }
}
