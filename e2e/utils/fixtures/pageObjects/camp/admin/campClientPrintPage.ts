import { Download, expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export class CampClientPrintPage {
  constructor(
    private readonly _page: Page,
    private readonly _downloadButton = _page.getByRole('button', {
      name: 'PDF herunterladen',
    })
  ) {}

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
