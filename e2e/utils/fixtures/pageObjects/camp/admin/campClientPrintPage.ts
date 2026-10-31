import { Download, expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export class CampClientPrintPage {
  static readonly ROUTE = '/admin/print'

  constructor(
    private readonly _page: Page,
    private readonly _campId: string,
    private readonly _downloadButton = _page.getByRole('button', {
      name: 'PDF herunterladen (Layout #2)',
    })
  ) {}

  @boxedStep
  async goto() {
    await this._page.goto(`/camps/${this._campId}${CampClientPrintPage.ROUTE}`)
    return this.loaded()
  }

  @boxedStep
  async loaded() {
    await expect(this._downloadButton).toBeVisible({ timeout: 30000 })
    return this
  }

  @boxedStep
  async downloadClientPdf(): Promise<Download> {
    const downloadPromise = this._page.waitForEvent('download')
    await this._downloadButton.click()
    return await downloadPromise
  }
}
