import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { LoginPage } from '@/utils/fixtures/pageObjects/loginPage'
import { bipiUser } from '@/utils/constants'
import { CampInfo } from '@/utils/fixtures/pageObjects/camp/admin/campInfo'
import { CampActivitySettings } from '@/utils/fixtures/pageObjects/camp/admin/campActivitySettings'

type CampPrototype = 'empty' | string

export type CampFixtureType = {
  createCamp: (prototype: CampPrototype) => Promise<Camp>
}

export const campFixture = {
  createCamp: async (
    { page, runId }: { page: Page; runId: string },
    use: (a: CampFixtureType['createCamp']) => Promise<void>
  ) => {
    await use((prototype) => new CreateCamp(page, runId).create(prototype))
  },
}

export class CreateCamp {
  private readonly _page: Page
  private readonly _campTitle: string

  constructor(page: Page, runId: string, campTitle = `camp ${runId}`) {
    this._page = page
    this._campTitle = campTitle
  }

  @boxedStep
  async openStep2(user = bipiUser) {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const in2Days = new Date(now)
    in2Days.setDate(in2Days.getDate() + 2)

    const loginPage = await new LoginPage(this._page).open()
    const campListPage = await loginPage.loginToCampList(user)
    const createCampDialogStep1 = await campListPage.openCreateCampDialog()
    await createCampDialogStep1.fillForm(tomorrow, in2Days, this._campTitle)

    return createCampDialogStep1.next()
  }

  @boxedStep
  async create(prototype: CampPrototype, user = bipiUser) {
    const createCampDialogStep2 = await this.openStep2(user)
    const campInfo = await createCampDialogStep2
      .selectPrototype(prototype)
      .then((value) => value.submit())

    return new Camp(this._page, campInfo.campId, this._campTitle, campInfo)
  }
}

export class Camp {
  constructor(
    private readonly _page: Page,
    private readonly _campId: string,
    private readonly _campTitle: string,
    private readonly _campInfo: CampInfo
  ) {}

  get campId(): string {
    return this._campId
  }

  get campTitle(): string {
    return this._campTitle
  }

  get campInfo(): CampInfo {
    return this._campInfo
  }

  get campActivitySettings() {
    return new CampActivitySettings(this._page, this._campId)
  }

  @boxedStep
  async delete() {
    const campInfo = this._campInfo
    await campInfo.goto()
    const dialog = await campInfo.openDeleteDialog()
    await dialog.fillPrompt(this._campTitle)
    await dialog.submit()

    await this._page.goto('/camps')
    await this._page.waitForURL('/camps', { timeout: 15000 })
    await expect(this._page.locator('.v-skeleton-loader')).toHaveCount(0)
    await expect(this._page.getByText(this._campTitle)).toBeHidden()
  }
}
