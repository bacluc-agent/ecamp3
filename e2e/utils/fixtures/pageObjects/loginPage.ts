import { expect, Locator, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { CampListPage } from '@/utils/fixtures/pageObjects/campListPage'

export const loginPageFixture = {
  loginPage: async (
    { page }: { page: Page },
    use: (loginPage: LoginPage) => Promise<void>
  ) => {
    await use(new LoginPage(page))
  },
}

export type LoginPageFixtureType = {
  loginPage: LoginPage
}

export class LoginPage {
  constructor(
    private readonly _page: Page,
    private readonly _quickLoginButton = _page.locator(
      '[role="alert"] button:has-text("Login")'
    ),
    private readonly _emailField = _page.locator('form').locator('input[name="email"]'),
    private readonly _passwordField = _page
      .locator('form')
      .locator('input[name="password"]'),
    private readonly _loginButton = _page.locator('form').locator('button[type="submit"]')
  ) {}

  @boxedStep
  async open() {
    await this._page.goto('/login', { timeout: 30_000 })
    return this.loaded()
  }

  @boxedStep
  async loaded() {
    // Four pure reads, so retrying them cannot pass by suppressing a side effect. toPass sets ONE
    // deadline for the whole block, never reads expect.timeout, and catches a thrown attempt to
    // poll again, so a failed attempt costs only its first failing wait: 10 s here, so 45 s is
    // four attempts. Four unretried 15 s reads had no second attempt at all, the same failure
    // class as CampListPage.loaded().
    await expect(async () => {
      await expect(this._quickLoginButton).toBeVisible({ timeout: 10_000 })
      await expect(this._emailField).toBeVisible({ timeout: 10_000 })
      await expect(this._passwordField).toBeVisible({ timeout: 10_000 })
      await expect(this._loginButton).toBeVisible({ timeout: 10_000 })
    }).toPass({ timeout: 45_000 })
    return this
  }

  @boxedStep
  async loginToCampList(user: string, password: string = 'test') {
    await this.loaded()
    await this._emailField.fill(user)
    await this._passwordField.fill(password)
    const campListPage = new CampListPage(this._page)
    // The submit button's enabled state is derived state: Login.vue:103 binds
    // :disabled="!(email && password) || authenticationInProgress", so the two fills above only
    // make it clickable once Vue has flushed, and a click issued in that window waits out its own
    // actionability check with nothing above it to retry. This was the only new action timeout on
    // the branch with no retry above it; every other guarded click got its per-attempt bound inside
    // a toPass. The guard is the same idiom ESelect.select(), CreateCampDialogStep1.next() and
    // campInfo's delete click already use, and it is what makes the retry safe: once a click
    // lands, authenticationInProgress disables the button, so a later attempt cannot re-POST
    // /api/auth/login and only re-asserts the destination read below. isEnabled() cannot carry
    // this guard on its own: it waits for the element and throws on timeout rather than reading
    // false, so after the redirect -- where /camps renders no form, so the locator matches
    // nothing -- it would burn the rest of the block's deadline and replace a named failure with
    // a bare "Timeout 45000ms exceeded while waiting on the predicate". isVisible() reads false
    // in 4 ms there and short-circuits it, and reads true while the form is up so the disabled
    // state is still what gates the click. The guard reads false in the other two states too --
    // before the flush, so the attempt waits for the next one instead of burning this one -- while
    // a login that really failed leaves the button enabled and IS clicked again, which is the
    // point. campListPage.loaded() carries its own toPass(30000), so the outer deadline buys click
    // attempts rather than one attempt: 45 s is one 30 s destination read plus a second 10 s
    // click, against the 40 s this path could already spend.
    await expect(async () => {
      if (
        (await this._loginButton.isVisible()) &&
        (await this._loginButton.isEnabled())
      ) {
        await this._loginButton.click({ timeout: 10_000 })
      }
      await campListPage.loaded()
    }).toPass({ timeout: 45_000 })
    return campListPage
  }

  get locator(): Locator {
    return this._page.locator('body')
  }

  get emailField(): Locator {
    return this._emailField
  }

  get passwordField(): Locator {
    return this._passwordField
  }
}
