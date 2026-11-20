import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

// Named `OAuthProfilePage`, not `ProfilePage`:
// `e2e/utils/fixtures/pageObjects/profilePage.ts` does not exist on `devel`.
// PR #67 adds it at that root path and PR #78 re-adds it stacked on #67, so a
// third add at the same path would be a three-way conflict the moment any of
// them merges first.
export class OAuthProfilePage {
  static readonly ROUTE = '/profile'

  constructor(
    private readonly _page: Page,
    private readonly _skeletonLoaders = _page.locator('.v-skeleton-loader'),
    private readonly _emailField = _page.locator('.e-profile--email input')
  ) {}

  @boxedStep
  async open() {
    await this._page.goto(OAuthProfilePage.ROUTE)
    return this.loaded()
  }

  @boxedStep
  async loaded() {
    // `Profile.vue` wraps the whole form in
    // `<v-skeleton-loader :loading="profile._meta.loading">`, so the email input
    // is not in the DOM at all while the profile is still loading.
    await expect(this._skeletonLoaders).toHaveCount(0)
    await expect(this._emailField).toBeVisible()
    return this
  }

  @boxedStep
  async emailValue(): Promise<string> {
    // `goto` resolves at `load` and `inputValue()` waits for the element to be
    // *attached*, never for it to hold a *value*. `use.actionTimeout` is unset
    // and `expect.timeout` is 15_000, so gate on a non-empty value before
    // reading it: otherwise a still-empty field makes the account-link tests
    // pass vacuously.
    await expect(this._emailField).not.toHaveValue('', { timeout: 15_000 })
    return await this._emailField.inputValue()
  }
}
