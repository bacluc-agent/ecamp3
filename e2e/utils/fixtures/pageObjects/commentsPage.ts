import { expect, Locator, Page } from '@playwright/test'

export class CommentsPage {
  constructor(private readonly _page: Page) {}

  get panel(): Locator {
    return this._page.getByTestId('comments-panel')
  }

  getComment(text: string): Locator {
    return this._page.getByTestId('comment-card').filter({ hasText: text })
  }

  async addComment(text: string, submitWithKeyboard = false) {
    const composer = this.panel.getByTestId('comment-composer')
    const editor = composer.locator('.ProseMirror')
    await editor.click()
    await editor.pressSequentially(text, { delay: 30 })
    if (submitWithKeyboard) {
      await this._page.keyboard.press('ControlOrMeta+Enter')
    } else {
      await composer.getByTestId('comment-submit').click()
    }
    return this.getComment(text)
  }

  async deleteComment(comment: Locator) {
    await comment.hover()
    await comment.locator('button.ec-comment-card__delete').click()
    await this._page.locator('.v-overlay--active button.bg-error').click()
    await expect(comment).toHaveCount(0)
  }
}
