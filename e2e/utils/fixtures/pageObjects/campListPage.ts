import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { CreateCampDialogStep1 } from '@/utils/fixtures/pageObjects/createCamp/createCampDialogStep1'

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
    // The create button is rendered outside the loading block, so it is clickable while the camp
    // list still grows; the list then shifts under the click and the click is lost. Same gate as
    // staleDeployment.spec.ts.
    await expect(this._page.locator('.v-skeleton-loader')).toHaveCount(0)
    return this
  }

  @boxedStep
  async openCreateCampDialog() {
    const createCampDialogStep1 = new CreateCampDialogStep1(this._page)
    await this.loaded()
    await this._createCampButton.click()
    await expect(this._page).toHaveURL(/\/camps\/create/, { timeout: 10000 })
    await createCampDialogStep1.loaded()

    return createCampDialogStep1
  }
}
