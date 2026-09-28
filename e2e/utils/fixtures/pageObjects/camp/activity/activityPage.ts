import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { CommentsPanel } from '@/utils/fixtures/pageObjects/comment/commentsPanel'

export class ActivityPage {
  constructor(
    private readonly _page: Page,
    private readonly _commentsToggle = _page.getByTestId('comments-toggle')
  ) {}

  @boxedStep
  async loaded() {
    await expect(this._commentsToggle).toBeVisible({ timeout: 20000 })
    return this
  }

  @boxedStep
  async openComments() {
    await this._commentsToggle.click()
    const commentsPanel = new CommentsPanel(this._page)
    await commentsPanel.loaded()
    return commentsPanel
  }
}
