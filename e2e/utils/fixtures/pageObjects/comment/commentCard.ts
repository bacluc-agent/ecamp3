import { expect, Locator, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export class CommentCard {
  constructor(
    private readonly _page: Page,
    private readonly _text: string,
    private readonly _card = _page.getByTestId('comment-card').filter({ hasText: _text }),
    private readonly _deleteButton = _card.locator('button.ec-comment-card__delete'),
    private readonly _confirmPrompt = _page.locator('.v-overlay--active'),
    private readonly _confirmButton = _confirmPrompt.locator('button.bg-error')
  ) {}

  @boxedStep
  async delete() {
    await this._card.hover()
    await expect(this._deleteButton).toBeVisible()
    await this._deleteButton.click()
    await this._confirmButton.click()
    return this
  }

  get element(): Locator {
    return this._card
  }
}
