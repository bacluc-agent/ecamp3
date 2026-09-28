import { expect, Locator, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { DialogChangePassword } from '@/utils/fixtures/pageObjects/user/dialogChangePassword'

export type ProfilePageFixtureType = {
  profilePage: ProfilePage
}

// noinspection JSUnusedGlobalSymbols
export const profilePageFixture = {
  profilePage: async (
    { page }: { page: Page },
    use: (a: ProfilePageFixtureType['profilePage']) => Promise<void>
  ) => {
    await use(new ProfilePage(page))
  },
}

export class ProfilePage {
  static readonly ROUTE = '/profile'

  constructor(
    private readonly _page: Page,
    private readonly _skeletonLoaders = _page.locator('.v-skeleton-loader')
  ) {}

  @boxedStep
  async open() {
    await this._page.goto(ProfilePage.ROUTE)
    return this.loaded()
  }

  @boxedStep
  async loaded() {
    await expect(this._skeletonLoaders).toHaveCount(0)
    return this
  }

  @boxedStep
  async openChangePasswordDialog() {
    await this._page
      .locator('.e-profile--password')
      .getByRole('button', { name: /Ändern/ })
      .click()
    const dialogChangePassword = new DialogChangePassword(this._page)
    await dialogChangePassword.loaded()
    return dialogChangePassword
  }

  get locator(): Locator {
    return this._page.locator('body')
  }
}
