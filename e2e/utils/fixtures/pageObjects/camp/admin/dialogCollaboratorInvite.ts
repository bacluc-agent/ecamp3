import { expect, Locator, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export class DialogCollaboratorInvite {
  constructor(
    private readonly _page: Page,
    private readonly _dialog = _page.getByTestId('collaborator-create-dialog'),
    private readonly _searchInput = _dialog.locator(
      '[data-testid="collaborator-invite-search"] input'
    ),
    private readonly _submitButton = _dialog.locator('[type="submit"]'),
    // The combobox menu is teleported into the overlay container below <body>,
    // so the result list is not inside the dialog.
    private readonly _results = _page.getByTestId('collaborator-invite-result')
  ) {}

  @boxedStep
  async loaded() {
    await expect(this._dialog).toBeVisible()
    // The dialog renders a skeleton loader instead of the form while loading,
    // so the search input is the gate that actually means "usable".
    await expect(this._searchInput).toBeVisible({ timeout: 10000 })
    return this
  }

  @boxedStep
  async searchProfiles(term: string) {
    await this._searchInput.fill(term)
    return this
  }

  @boxedStep
  async selectResult(email: string) {
    await this.result(email).click()
    return this
  }

  @boxedStep
  async blurSearch() {
    await this._searchInput.blur()
    return this
  }

  @boxedStep
  async submit() {
    // Selecting a result empties the profiles but leaves the combobox search
    // text, so the "no matching people" menu stays open on top of the dialog
    // actions. Move the focus away and focus the button before clicking it,
    // otherwise the click is intercepted by the menu.
    await this._page.keyboard.press('Tab')
    await this._submitButton.focus()
    await this._submitButton.click()
    return this
  }

  get searchInput(): Locator {
    return this._searchInput
  }

  result(text: string): Locator {
    return this._results.filter({ hasText: text })
  }
}
