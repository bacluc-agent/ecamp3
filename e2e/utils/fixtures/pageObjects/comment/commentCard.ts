import { expect, Locator, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { PromptDeleteComment } from '@/utils/fixtures/pageObjects/comment/promptDeleteComment'

export class CommentCard {
  constructor(
    private readonly _page: Page,
    private readonly _text: string,
    private readonly _card = _page.getByTestId('comment-card').filter({ hasText: _text }),
    private readonly _content = _card.locator('.ProseMirror'),
    private readonly _deleteButton = _card.locator('button.ec-comment-card__delete')
  ) {}

  @boxedStep
  async delete() {
    // The delete button is .visible-on-hover (max-width: 0, opacity: 0 off
    // hover), so hover first and wait for the reveal before clicking.
    await this._card.hover()
    await expect(this._deleteButton).toBeVisible()
    await this._deleteButton.click()

    const promptDeleteComment = new PromptDeleteComment(this._page)
    await promptDeleteComment.loaded()
    await promptDeleteComment.confirm()
    return this
  }

  get element(): Locator {
    return this._card
  }

  get content(): Locator {
    return this._content
  }
}
