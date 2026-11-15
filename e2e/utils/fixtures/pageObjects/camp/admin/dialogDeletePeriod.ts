import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export class DialogDeletePeriod {
  constructor(
    private readonly _page: Page,
    private readonly _dialog = _page.locator('.v-overlay--active'),
    private readonly _promptInput = this._dialog.locator('[name="promptText"] input'),
    private readonly _deleteButton = this._dialog.getByRole('button', {
      name: /Löschen/i,
    })
  ) {}

  @boxedStep
  async loaded() {
    await expect(this._promptInput).toBeVisible()
    return this
  }

  get scheduleEntryWarning() {
    return this._dialog.getByText(/Zeitplaneinträge/)
  }

  get deleteButton() {
    return this._deleteButton
  }

  @boxedStep
  async fillPrompt(description: string) {
    await this._promptInput.fill(description)
    return this
  }

  @boxedStep
  async close() {
    await this._dialog.getByRole('button', { name: /Abbrechen/i }).click()
    return this
  }

  @boxedStep
  async submit() {
    await this._deleteButton.click()
    return this
  }
}
