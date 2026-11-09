import { expect, Locator, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

// Not part of the frontend: the local mock OAuth2 provider
// (`dev-setup/mock-oauth/mock-oauth2-login.html`) serves this page at
// `PATH_PREFIX/<provider>/authorize`, so it gets its own page object.
export class MockOauthProviderPage {
  static readonly PATH_PREFIX = '/mock-auth'

  constructor(
    private readonly _page: Page,
    private readonly _userButtons = _page.getByRole('button')
  ) {}

  @boxedStep
  async loaded() {
    // The user buttons only exist once the provider has answered the authorize
    // request, so their visibility is the arrival signal. `10_000` is the
    // hand-off budget the OAuth helper has always used; do not raise it.
    await expect(this._userButtons.first()).toBeVisible({ timeout: 10_000 })
    return this
  }

  userButton(email: string): Locator {
    // Each pre-configured user is a `button` holding `<span class="user-email">`
    // and `<span class="user-name">`, so the accessible name is `"<email> <name>"`.
    // `hasText` matches the same set as the previous
    // `getByRole('button', { name: new RegExp(escapeRegExp(email)) })` without the
    // regex escaping. It is a substring match, which is unambiguous here: the
    // page's emails are `test@example.com`, `test2@example.com` and
    // `admin@example.com`, and none of them is a substring of another.
    return this._userButtons.filter({ hasText: email })
  }

  @boxedStep
  async selectUser(email: string) {
    await this.userButton(email).click()
    return this
  }
}
