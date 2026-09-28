import { expect, Page, Request, Response } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { ESelect } from '@/utils/fixtures/components/eSelect'
import { CampInfo } from '@/utils/fixtures/pageObjects/camp/admin/campInfo'

export class CreateCampDialogStep2 {
  constructor(
    private readonly _page: Page,
    _form = _page.locator('form'),
    private readonly _prototypeSelect = new ESelect(
      _form.locator('div.v-input[data-testid="prototype-select"]')
    ),
    private readonly _createCampButton = _form.getByTestId('create-camp-button')
  ) {}

  @boxedStep
  async loaded() {
    await expect(this._prototypeSelect.locator).toBeVisible()
    return this
  }

  @boxedStep
  async selectPrototype(prototype: string) {
    await this._prototypeSelect.open()
    await this._prototypeSelect.select(prototype)
    return this
  }

  @boxedStep
  async selectOtherCampPrototype() {
    return this.selectPrototype('Einstellungen von einem anderen Lager kopieren…')
  }

  @boxedStep
  async requestClipboardPaste(settlement: 'resolved' | 'rejected') {
    const allowButton = this._page.getByRole('button', { name: 'Jetzt erlauben' })
    await expect(allowButton).toBeVisible({ timeout: 5000 })
    await allowButton.click()
    // The dialog's allow handler is async: it awaits the clipboard read and only then
    // re-queries the permission. Closing before the read settled destroys the dialog, the
    // allow button can never be pressed again and the clipboard read is lost for the rest
    // of the test, so wait for the read to settle first.
    await expect(this._page.locator('html')).toHaveAttribute(
      'data-clipboard-read-settlement',
      settlement
    )
    const closeButton = this._page.getByRole('button', { name: 'Schliessen' })
    await closeButton.click()
    await expect(closeButton).toBeHidden()
    return this
  }

  @boxedStep
  async fillManualPrototypeUrl(url: string) {
    await this._page.getByLabel('Link zum gewünschten Vorlage-Lager').fill(url)
    return this
  }

  @boxedStep
  async expectSelectedPrototype(value: string) {
    await expect(this._prototypeSelect.locator).toContainText(value)
    return this
  }

  @boxedStep
  async expectNoPrototypePreview() {
    await expect(this._page.getByText('Vorschau der Lagervorlage')).toBeHidden()
    return this
  }

  @boxedStep
  async expectCopiedPrototype() {
    await this.expectSelectedPrototype('GRGR')
    await expect(this._page.getByText('Vorschau der Lagervorlage')).toBeVisible({
      timeout: 30_000,
    })
    return this
  }

  @boxedStep
  async submitCapturingCreateCampRequest() {
    const isCreateCamp = (request: Request) =>
      request.method() === 'POST' && new URL(request.url()).pathname === '/api/camps'
    const createCampRequests: Request[] = []
    const countCreateCampRequest = (request: Request) => {
      if (isCreateCamp(request)) createCampRequests.push(request)
    }
    this._page.on('request', countCreateCampRequest)
    try {
      // The create button only exists while the form is dirty and valid, and the prototype
      // preview moves it while it renders, so a click can land between mousedown and mouseup
      // and be dispatched on the common ancestor instead. Pairing the click with the request
      // and the navigation is the helpers.ts idiom, and it also drains the request Firefox
      // does not tolerate in flight when a test ends.
      const created = this._page.waitForResponse(
        (response: Response) => isCreateCamp(response.request()),
        { timeout: 60000 }
      )
      const campInfoRoute = this._page.waitForURL(`**${CampInfo.ROUTE}`, {
        timeout: 60000,
      })
      await expect(async () => {
        await expect(this._createCampButton).toBeVisible()
        await this._createCampButton.click()
        // page.on('request') fires a round trip after click() resolves, so this guard has to
        // poll: a one-shot check reads 0 on a click that did emit a request, the retry fires a
        // second POST and a second camp is created.
        await expect
          .poll(() => createCampRequests.length, { timeout: 5000 })
          .toBeGreaterThan(0)
      }).toPass({ timeout: 30000 })
      const [response] = await Promise.all([created, campInfoRoute])
      // A click lost to a layout shift must never be retried into a second camp.
      expect(createCampRequests).toHaveLength(1)
      return response.request().postDataJSON() as {
        campPrototype?: string | null
      }
    } finally {
      this._page.off('request', countCreateCampRequest)
    }
  }

  @boxedStep
  async submit() {
    await this.submitCapturingCreateCampRequest()

    const campInfo = new CampInfo(this._page, this.campIdFromUrl())
    await campInfo.loaded()
    return campInfo
  }

  campIdFromUrl() {
    const url = this._page.url()
    const match = url.match(new RegExp(`/camps/([^/]+)/.*${CampInfo.ROUTE}`))
    const campId = match?.[1]
    if (!campId) {
      throw new Error(`Could not extract camp id from URL: ${url}`)
    }
    return campId
  }
}
