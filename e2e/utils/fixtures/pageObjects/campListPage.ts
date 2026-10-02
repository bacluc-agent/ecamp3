import { expect, Locator, Page } from '@playwright/test'
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
  static readonly ROUTE = '/camps'

  constructor(
    private readonly _page: Page,
    private readonly _heading = _page.getByRole('heading', { name: 'Meine Lager' }),
    private readonly _createCampButton = _page.getByTestId('create-camp-button')
  ) {}

  @boxedStep
  async loaded() {
    await expect(this._page).toHaveURL((url) => url.pathname === CampListPage.ROUTE)
    await expect(this._heading).toBeVisible()
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

  get locator(): Locator {
    return this._page.locator('body')
  }
}
