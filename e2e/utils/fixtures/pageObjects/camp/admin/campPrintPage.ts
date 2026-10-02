import { Download, expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { grgrCampId } from '@/utils/constants'

export const campPrintPageFixture = {
  campPrintPage: async (
    { page }: { page: Page },
    use: (a: CampPrintPageFixtureType['campPrintPage']) => Promise<void>
  ) => {
    await use(new CampPrintPage(page, grgrCampId))
  },
}

export type CampPrintPageFixtureType = {
  campPrintPage: CampPrintPage
}

export class CampPrintPage {
  static readonly ROUTE = '/admin/print'

  constructor(
    private readonly _page: Page,
    private readonly _campId: string,
    private readonly _downloadButton = _page.getByRole('button', {
      name: /PDF herunterladen \(Layout #1\)/,
    })
  ) {}

  @boxedStep
  async goto() {
    await this._page.goto(`/camps/${this._campId}${CampPrintPage.ROUTE}`)
    return this.loaded()
  }

  @boxedStep
  async loaded() {
    await expect(this._downloadButton).toBeVisible()
    return this
  }

  @boxedStep
  async downloadNuxtPdf(): Promise<Download> {
    const downloadPromise = this._page.waitForEvent('download')
    await this._downloadButton.click()
    return await downloadPromise
  }
}
