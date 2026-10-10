import { Download, expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { grgrCampId } from '@/utils/constants'

export const campProgramPrintPageFixture = {
  campProgramPrintPage: async (
    { page }: { page: Page },
    use: (a: CampProgramPrintPageFixtureType['campProgramPrintPage']) => Promise<void>
  ) => {
    await use(new CampProgramPrintPage(page, grgrCampId))
  },
}

export type CampProgramPrintPageFixtureType = {
  campProgramPrintPage: CampProgramPrintPage
}

export class CampProgramPrintPage {
  static readonly ROUTE = '/program'

  constructor(
    private readonly _page: Page,
    private readonly _campId: string,
    private readonly _printMenu = _page.getByTestId('campprogram-menu'),
    private readonly _downloadItem = _page
      .locator('.v-list-item')
      .filter({ hasText: 'PDF herunterladen (Layout #1)' })
  ) {}

  @boxedStep
  async goto() {
    await this._page.goto(`/camps/${this._campId}${CampProgramPrintPage.ROUTE}`)
    return this.loaded()
  }

  @boxedStep
  async loaded() {
    await expect(this._printMenu).toBeVisible()
    return this
  }

  @boxedStep
  async downloadNuxtPdf(): Promise<Download> {
    await this._printMenu.click()
    const downloadPromise = this._page.waitForEvent('download')
    await this._downloadItem.click()
    return await downloadPromise
  }
}
