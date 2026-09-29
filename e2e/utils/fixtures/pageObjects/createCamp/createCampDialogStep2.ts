import { expect, Page, Request } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { ESelect } from '@/utils/fixtures/components/eSelect'
import { CampInfo } from '@/utils/fixtures/pageObjects/camp/admin/campInfo'

// frontend/src/locales/de.json
const ALLOW_BUTTON_LABEL = 'Jetzt erlauben' // components.campCreate.campCreateStep2.clipboardInfoDialog.allow
const CLOSE_BUTTON_LABEL = 'Schliessen' // global.button.close
const PREVIEW_HEADING = 'Vorschau der Lagervorlage' // components.campCreate.campCreateStep2.preview
const OTHER_PROTOTYPE_OPTION = 'Einstellungen von einem anderen Lager kopieren…' // components.campCreate.campCreateStep2.otherPrototype

export class CreateCampDialogStep2 {
  constructor(
    private readonly _page: Page,
    _form = _page.locator('form'),
    private readonly _prototypeSelect = new ESelect(
      _form.locator('div.v-input[data-testid="prototype-select"]')
    ),
    private readonly _createCampButton = _form.getByTestId('create-camp-button'),
    private readonly _allowButton = _page.getByRole('button', {
      name: ALLOW_BUTTON_LABEL,
    }),
    private readonly _closeButton = _page
      .locator('.v-overlay--active')
      .getByRole('button', { name: CLOSE_BUTTON_LABEL }),
    private readonly _manualPrototypeUrlField = _page.getByLabel(
      'Link zum gewünschten Vorlage-Lager'
    ),
    private readonly _previewBlock = _form.locator('.dashborder'),
    private readonly _previewContent = _previewBlock.locator('.v-list-item'),
    private readonly _previewHeading = _previewBlock.getByRole('heading', {
      name: PREVIEW_HEADING,
    })
  ) {}

  private _createdCampId: string | undefined

  get createdCampId() {
    return this._createdCampId
  }

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
    return this.selectPrototype(OTHER_PROTOTYPE_OPTION)
  }

  @boxedStep
  async grantClipboardRead() {
    // The dialog only mounts after the select interaction and its overlay have animated, so this
    // gate was below the config's own expect.timeout. It is a failure budget, not a delay.
    await expect(this._allowButton).toBeVisible({ timeout: 30_000 })
    await this._allowButton.click({ timeout: 10_000 })
    // The dialog's allow handler is async: it awaits the clipboard read and only then
    // re-queries the permission. Closing before the read settled destroys the dialog, the
    // allow button can never be pressed again and the clipboard read is lost for the rest
    // of the test, so the caller has to wait for the read to settle before closing. That
    // wait lives in the fixture that writes the marker, ClipboardStub.expectReadSettled(),
    // so this page object does not depend on the stub. Do NOT wait for the allow button to
    // disappear here instead: on a rejected read the re-query still reports "prompt", the
    // button stays visible and that wait would hang until the test times out.
    return this
  }

  @boxedStep
  async closeClipboardInfoDialog() {
    // toBeHidden() also passes when the element never existed, so without this the whole
    // method degenerates into a no-op that passes when the dialog never opened. Proving it was
    // there first is the only thing that makes the toBeHidden() below a real assertion.
    await expect(this._closeButton).toBeVisible()
    // The isVisible() guard makes this retryable: the click fires right after the async allow
    // handler that expectReadSettled() just unblocked, into an overlay that is still closing.
    await expect(async () => {
      if (await this._closeButton.isVisible()) {
        await this._closeButton.click({ timeout: 10000 })
      }
      await expect(this._closeButton).toBeHidden({ timeout: 10_000 })
    }).toPass({ timeout: 30_000 })
    return this
  }

  @boxedStep
  async fillManualPrototypeUrl(url: string) {
    await this._manualPrototypeUrlField.fill(url)
    return this
  }

  @boxedStep
  async expectSelectedPrototype(value: string) {
    await expect(this._prototypeSelect.locator).toContainText(value, { timeout: 30_000 })
    return this
  }

  @boxedStep
  async expectNoPrototypePreview() {
    await expect(this._previewHeading).toBeHidden()
    return this
  }

  @boxedStep
  async expectCopiedPrototype() {
    // Three pure reads, so retrying them cannot pass by suppressing a side effect: nothing here
    // clicks, fills, navigates or mutates. toPass spends ONE budget on the whole block, so a
    // retry covers the whole chain instead of only the read that was still pending. Per-read
    // timeouts stay below the block budget on purpose: at or above it the first attempt would
    // swallow the whole budget and the retry would buy nothing. 70 s, and not more, because
    // submit()'s own worst case after this block is about 100 s and the spec's budget is
    // 210 s, so a block that could outlast the rest of the test would report a bare test
    // timeout instead of the preview failure it is about.
    await expect(async () => {
      // The select text and the preview render in the same pass: the loaded clipboard entity
      // sets the selection, and the pre-flush watchEffect derives the campPrototype the preview
      // is built from, so the first assertion is the gate. The preview is the last of the three
      // clipboard outcomes to appear in Firefox, hence the 30 s budget on the second assertion.
      await this.expectSelectedPrototype('GRGR')
      await expect(this._previewHeading).toBeVisible({ timeout: 30_000 })
      // The heading renders the moment prototypePreview is non-null, but the four relation
      // lists below it are lazily loaded HAL relations (CampCreateStep2.vue:64-147) and the
      // submit button sits under all of them in ContentActions (:164-182), so it keeps moving
      // down the page while they stream in. The first rendered row is what proves the block
      // stopped growing, so the click in submit() is not dispatched into a moving target and
      // not lost between mousedown and mouseup.
      await expect(this._previewContent.first()).toBeVisible({ timeout: 30_000 })
    }).toPass({ timeout: 70000 })
    return this
  }

  @boxedStep
  async submit() {
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
      // and the navigation also drains the request Firefox does not tolerate in flight when a
      // test ends.
      await expect(async () => {
        // The click is guarded on no POST having been seen yet, not just on the button being
        // visible: a POST is in flight while the button is still visible, so a retry after a
        // lost navigation response would re-click it and create a second camp. The guard below
        // only learns about the POST a round trip later, which is the window this closes.
        if (createCampRequests.length === 0) {
          await expect(this._createCampButton).toBeVisible({ timeout: 5000 })
          await this._createCampButton.click({ timeout: 5000 })
        }
        // page.on('request') fires a round trip after click() resolves, so this guard has to
        // poll: a one-shot check reads 0 on a click that did emit a request, the retry fires a
        // second POST and a second camp is created. The 15 s is measured, not chosen. On this
        // head the poll alone needed 4.88 s of a 5 s budget in run 36509282158 job 109220232146
        // step 15 (webkit repetition 5) and 4.87 s in job 109220232077 (webkit repetition 9);
        // on 3ffe48dd0 in run 36488254849 it was the one toPass block of 482 in the run that
        // needed a second attempt, giving up at 4869 ms. At 5 s this poll loses that race
        // often enough to be a second camp, and the toHaveLength(1) below only notices one
        // after it exists. One full attempt is 5 s click plus 15 s poll, so the 30 s block
        // still pays for both.
        await expect
          .poll(() => createCampRequests.length, { timeout: 15000 })
          .toBeGreaterThan(0)
      }).toPass({ timeout: 30000 })
      // The camp id is read from the URL and, when the navigation never lands, from the
      // response body below, so this waiter is load-bearing for the diagnostic but no longer
      // the only handle the teardown has.
      const campInfoRoute = this._page.waitForURL(`**${CampInfo.ROUTE}`, {
        timeout: 30_000,
      })
      // Hand the created camp over the moment the navigation lands, not on the way out: a throw
      // in either toHaveLength(1) guard, in campIdFromUrl, in campInfo.loaded() or in the
      // caller's own use of the result leaves the camp behind, and every camp a test leaks
      // pushes the create button of the next one further down the camp list. This waiter is
      // armed before the POST is even answered, it resolves with the URL, and
      // campIdFromUrl() parses that URL, so it cannot throw here; the rejection handler keeps a
      // timeout from rejecting a derived promise nobody listens to. It is armed above the
      // first toHaveLength(1) and not after it, because that guard throws on a second POST and
      // a throw there ran the rest of this method with no handle on the camp at all. It cannot
      // be armed above the toPass as well: its own 30 s would expire while that block's 30 s
      // and the response poll below were still running. That throw still leaks the camp, and
      // it is the hole left.
      campInfoRoute.then(
        () => {
          this._createdCampId = this.campIdFromUrl()
        },
        () => undefined
      )
      // A click lost to a layout shift must never be retried into a second camp.
      expect(createCampRequests).toHaveLength(1)

      const [createCampRequest] = createCampRequests
      // A page-wide waitForResponse armed before the click is what reported
      // "page.waitForResponse: Timeout 60000ms exceeded" in run 36358234549 (jobs 108743202916
      // and 108743203036) while the real defect stayed invisible: the loop above had already
      // passed, so a POST existed, but the waiter could not say which request it waited for.
      // Polling the request we actually captured names it, and both waits are 30 s so the
      // failure arrives inside the spec's 210 s budget with a live page for the retained trace.
      await expect
        .poll(() => createCampRequest.existingResponse() !== null, { timeout: 30_000 })
        .toBe(true)
      // The body is read here, before the navigation, and only when no id is known yet: a
      // response body is not guaranteed to still be readable once the document has navigated
      // away, and the URL is the better source whenever it arrived, which is the normal case.
      // This is not a convenience fallback, it is the only handle the teardown has in exactly
      // the case this branch is about -- the POST answered and the navigation was lost -- and
      // without it the camp leaks and the next test's shared `camp ${runId}` title no longer
      // matches a single camp (the pre-fix failure in run 36394159617 job 108848061633 step
      // 15). A non-2xx answer leaves the id unset, because then there is no camp to delete.
      const createCampResponse = createCampRequest.existingResponse()
      if (this._createdCampId === undefined && createCampResponse?.ok()) {
        this._createdCampId = ((await createCampResponse.json()) as { id?: string }).id
      }
      await campInfoRoute
      expect(createCampRequests).toHaveLength(1)

      const campInfo = new CampInfo(this._page, this.campIdFromUrl())
      await campInfo.loaded()

      return {
        campPrototype: (
          createCampRequest.postDataJSON() as {
            campPrototype?: string | null
          }
        ).campPrototype,
        campInfo,
      }
    } finally {
      this._page.off('request', countCreateCampRequest)
    }
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
