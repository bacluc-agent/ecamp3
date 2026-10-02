import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { CreateCampDialogStep1 } from '@/utils/fixtures/pageObjects/createCamp/createCampDialogStep1'
import { CampDashboard } from '@/utils/fixtures/pageObjects/camp/dashboard'

export type CampListPageFixtureType = {
  camplistPage: CampListPage
}

// noinspection JSUnusedGlobalSymbols
export const camplistPageFixture = {
  camplistPage: async (
    { page }: { page: Page },
    use: (a: CampListPageFixtureType['camplistPage']) => Promise<void>
  ) => {
    await use(new CampListPage(page))
  },
}

export class CampListPage {
  constructor(
    private readonly _page: Page,
    private readonly _createCampButton = _page.getByTestId('create-camp-button')
  ) {}

  @boxedStep
  async loaded() {
    await expect(this._createCampButton).toBeVisible()
    return this
  }

  @boxedStep
  async openCreateCampDialog() {
    await this._createCampButton.click()
    const createCampDialogStep1 = new CreateCampDialogStep1(this._page)
    await createCampDialogStep1.loaded()
    return createCampDialogStep1
  }

  @boxedStep
  async openCamp(campTitle: string) {
    const campLink = this._page.getByRole('link', { name: campTitle })
    await expect(campLink).toBeVisible()
    await campLink.click()
    const campDashboard = new CampDashboard(this._page)
    await campDashboard.loaded()
    return campDashboard
  }
}
