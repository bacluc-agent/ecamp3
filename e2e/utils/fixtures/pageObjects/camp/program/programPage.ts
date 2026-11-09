import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { skilagerCampId, skilagerCampShortTitle } from '@/utils/constants'
import { ActivityPage } from '@/utils/fixtures/pageObjects/camp/activity/activityPage'

export type ProgramPageFixtureType = {
  programPage: ProgramPage
}

// noinspection JSUnusedGlobalSymbols
export const programPageFixture = {
  programPage: async (
    { page }: { page: Page },
    use: (a: ProgramPageFixtureType['programPage']) => Promise<void>
  ) => {
    await use(new ProgramPage(page, skilagerCampId, skilagerCampShortTitle))
  },
}

export class ProgramPage {
  static readonly ROUTE = '/program'

  constructor(
    private readonly _page: Page,
    private readonly _campId: string,
    private readonly _campShortTitle: string,
    private readonly _activityLink = _page.locator('a[href*="/program/activity/"]')
  ) {}

  @boxedStep
  async goto() {
    await this._page.goto(
      `/camps/${this._campId}/${this._campShortTitle}${ProgramPage.ROUTE}`
    )
    await this.loaded()
    return this
  }

  @boxedStep
  async loaded() {
    await expect(this._activityLink.first()).toBeVisible({ timeout: 20000 })
    return this
  }

  @boxedStep
  async openFirstActivity() {
    await this._activityLink.first().click()
    const activityPage = new ActivityPage(this._page)
    await activityPage.loaded()
    return activityPage
  }
}
