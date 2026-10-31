import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export class PromptDeleteComment {
  constructor(
    private readonly _page: Page,
    private readonly _prompt = _page.locator('.v-overlay.v-menu .ec-popover-prompt'),
    private readonly _confirmButton = _prompt.getByRole('button', { name: 'Löschen' })
  ) {}

  @boxedStep
  async loaded() {
    await expect(this._confirmButton).toBeVisible({ timeout: 10000 })
    return this
  }

  @boxedStep
  async confirm() {
    await this._confirmButton.click()
    return this
  }
}
