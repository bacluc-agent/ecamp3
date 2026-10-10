import { expect, Locator } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export class ESelect {
  constructor(
    private readonly _locator: Locator,
    // the select's own aria-expanded is the only open/closed signal it publishes
    private readonly _activator = _locator.locator('input[aria-expanded]'),
    private readonly _page = _locator.page()
  ) {}

  @boxedStep
  async open() {
    await this._locator.click()
    await expect(this._activator).toHaveAttribute('aria-expanded', 'true')
    return this
  }

  @boxedStep
  async select(value: string) {
    // ponytail: page-scoped role=option assumes a single open select per page;
    // scope it through the activator's aria-controls id if that ever changes
    await this._page.getByRole('option', { name: value, exact: true }).click()
    await expect(this._activator).toHaveAttribute('aria-expanded', 'false')
    return this
  }

  get locator(): Locator {
    return this._locator
  }
}
