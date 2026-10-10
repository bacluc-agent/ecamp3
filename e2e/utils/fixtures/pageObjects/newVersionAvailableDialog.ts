import { expect, Locator, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export class NewVersionAvailableDialog {
  constructor(
    page: Page,
    private readonly _dialog = page.getByTestId('new-version-dialog'),
    private readonly _updateButton = page.getByTestId('new-version-update'),
    private readonly _continueButton = page.getByTestId('new-version-continue')
  ) {}

  @boxedStep
  async shown() {
    await expect(this._dialog).toBeVisible({ timeout: 30000 })
    await expect(this._updateButton).toBeVisible()
    await expect(this._continueButton).toBeVisible()
    return this
  }

  @boxedStep
  async continueWithoutUpdating() {
    await this._continueButton.click()
    return this
  }

  get locator(): Locator {
    return this._dialog
  }
}
