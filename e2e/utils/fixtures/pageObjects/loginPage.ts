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
    await this._loginButton.click({ timeout: 10_000 })
    const campListPage = new CampListPage(this._page)
    await campListPage.loaded()
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
