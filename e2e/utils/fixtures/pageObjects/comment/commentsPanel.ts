import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { CommentCard } from '@/utils/fixtures/pageObjects/comment/commentCard'

export class CommentsPanel {
  constructor(
    private readonly _page: Page,
    private readonly _panel = _page.getByTestId('comments-panel'),
    private readonly _composer = _panel.getByTestId('comment-composer'),
    private readonly _editor = _composer.locator('.ProseMirror'),
    private readonly _submitButton = _composer.getByTestId('comment-submit')
  ) {}

  @boxedStep
  async loaded() {
    await expect(this._panel).toBeVisible()
    await expect(this._editor).toBeVisible()
    return this
  }

  @boxedStep
  async write(text: string) {
    await this._editor.click()
    await this._editor.pressSequentially(text, { delay: 30 })
    return this
  }

  @boxedStep
  async submit() {
    await this._submitButton.click()
    return this
  }

  @boxedStep
  async comment(text: string) {
    return new CommentCard(this._page, text)
  }
}
