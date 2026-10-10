import { Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { LoginPage } from '@/utils/fixtures/pageObjects/loginPage'

export type UserMenuFixtureType = {
  userMenu: UserMenu
}

// noinspection JSUnusedGlobalSymbols
export const userMenuFixture = {
  userMenu: async (
    { page }: { page: Page },
    use: (a: UserMenuFixtureType['userMenu']) => Promise<void>
  ) => {
    await use(new UserMenu(page))
  },
}

export class UserMenu {
  constructor(
    private readonly _page: Page,
    private readonly _logoutItem = _page
      .getByRole('listitem')
      .filter({ hasText: 'Ausloggen' })
  ) {}

  @boxedStep
  async logout(displayName: string) {
    await this._page.getByRole('button', { name: displayName }).click()
    await this._logoutItem.click()
    await this._page.waitForURL((url) => url.pathname.endsWith('/login'), {
      timeout: 30000,
    })
    const loginPage = new LoginPage(this._page)
    await loginPage.loaded()
    return loginPage
  }
}
