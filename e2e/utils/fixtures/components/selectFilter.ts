import { expect, Locator, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export class SelectFilter {
  constructor(
    private readonly _page: Page,
    private readonly _label: string,
    private readonly _chip = _page.locator(`span.v-chip:has-text("${_label}")`)
  ) {}

  @boxedStep
  async open() {
    await this._chip.click()
    return this
  }

  @boxedStep
  async toggle(itemLabel: string) {
    const item = this._page
      .getByRole('listitem')
      .filter({ has: this._page.getByText(itemLabel, { exact: true }) })
    const overlay = item.locator(
      'xpath=ancestor::*[contains(@class, "v-overlay__content")]'
    )
    await expect(overlay).toHaveCSS('pointer-events', 'auto')
    await item.scrollIntoViewIfNeeded()
    await item.click()
    return this
  }

  get chip(): Locator {
    return this._chip
  }
}
