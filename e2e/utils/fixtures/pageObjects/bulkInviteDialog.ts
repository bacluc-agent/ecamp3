import { expect, Locator, Page } from '@playwright/test'

export class BulkInviteDialog {
  private readonly _overlay: Locator

  constructor(private readonly _page: Page) {
    this._overlay = _page.locator('.v-overlay--active')
  }

  async open() {
    await this._page.getByRole('button', { name: 'Mehrere Personen einladen' }).click()
    await expect(this._overlay).toBeVisible()
    return this
  }

  get overlay() {
    return this._overlay
  }

  get emailInput() {
    return this._overlay.getByRole('textbox')
  }

  get submitButton() {
    return this._overlay.getByRole('button', { name: 'Einladungen verschicken' })
  }

  async close() {
    await this._page.keyboard.press('Escape')
    await expect(this._overlay).toBeHidden()
  }
}
