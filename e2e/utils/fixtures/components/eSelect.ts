import { expect, Locator } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export class ESelect {
  constructor(
    private readonly _locator: Locator,
    private readonly _selectOpenLocator = _locator.page().locator('.v-overlay--active'),
    private readonly _selectClosedLocator = _selectOpenLocator.getByRole('listbox')
  ) {}

  @boxedStep
  async open() {
    await this._locator.click()
    await expect(this._selectOpenLocator).toBeVisible({
      timeout: 10000,
    })
    return this
  }

  @boxedStep
  async select(value: string) {
    // Three overlays are alive at once on the create-camp step (the select menu, the clipboard
    // dialog and the submit button's tooltip), so the menu is scoped to the active overlay
    // rather than the page. The option text is a translation, so assert it separately:
    // without this a renamed option burns the whole test timeout on a click that can never
    // land, and the failure says nothing about which part of the dialog broke.
    const option = this._selectOpenLocator.getByText(value, { exact: true })
    await expect(option).toBeVisible()
    await option.click()

    await expect(this._selectClosedLocator).toBeHidden({
      timeout: 10000,
    })

    return this
  }

  get locator(): Locator {
    return this._locator
  }
}
