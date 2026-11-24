import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export class DialogDeletePeriod {
  constructor(
    private readonly _page: Page,
    _dialog = _page.locator('.v-overlay--active'),
    private readonly _promptInput = _dialog.locator('[name="promptText"] input'),
    private readonly _deleteButton = _dialog.getByRole('button', {
      name: /Löschen/i,
    })
  ) {}

  @boxedStep
  async loaded() {
    await expect(this._promptInput).toBeVisible()
    return this
  }

  get scheduleEntryWarning() {
    // The explanation paragraph also mentions "Zeitplaneinträge"; the warning is the last one.
    return this._page
      .locator('.v-overlay--active')
      .getByText(/Zeitplaneinträge/)
      .last()
  }

  get deleteButton() {
    return this._deleteButton
  }

  get promptInput() {
    return this._promptInput
  }

  get lastPeriodWarning() {
    return this._page
      .locator('.v-overlay--active')
      .getByText(/letzte Lagerabschnitt kann nicht gelöscht werden/i)
  }

  @boxedStep
  async fillPrompt(description: string) {
    await this._promptInput.fill(description)
    return this
  }

  @boxedStep
  async close() {
    await this._page
      .locator('.v-overlay--active')
      .getByRole('button', { name: /Abbrechen/i })
      .click()
    return this
  }

  @boxedStep
  async submit() {
    await this._deleteButton.click()
    return this
  }
}
