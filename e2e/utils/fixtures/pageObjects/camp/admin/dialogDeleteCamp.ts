import { expect, Locator, Page, Response } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export class DialogDeleteCamp {
  // A v-tooltip is a .v-overlay--active too, so the dialog is the one active overlay that
  // contains the prompt input. A page-wide .v-overlay--active would match both and turn
  // every assertion here into a 30 s strict-mode retry.
  static readonly LOCATOR = '.v-overlay--active:has([name="promptText"])'
  readonly dialog: Locator

  constructor(
    private readonly _page: Page,
    dialog: Locator = _page.locator(DialogDeleteCamp.LOCATOR),
    private readonly _promptInput = dialog.locator('[name="promptText"] input'),
    private readonly _deleteButton = dialog.getByRole('button', {
      name: /Löschen/i,
    })
  ) {
    this.dialog = dialog
  }

  @boxedStep
  async loaded() {
    // The input is the last thing the dialog renders, and it was measured at 10.03 s
    // against this 10 s budget in run 36509282158 job 109220231972 step 15 (firefox
    // repetition 7), so it landed past its own deadline and still passed. That
    // matters here more than it would inside a toPass, because campInfo.ts:63's
    // dialog.isVisible() guard returns false in exactly that window -- overlay up,
    // input not rendered yet -- so the enclosing block re-clicks a button under the
    // overlay and spends another 10 s failing for actionability. 20 s is the right
    // size for that measurement, but note what it costs: 10 s activator + 10 s button
    // + 10 s click + 20 s here is 50 s of the 60 s block, so this attempt is still the
    // only one and a first failure still ends the delete instead of being retried. If
    // that retry is wanted back, raise the block in campInfo.ts:67 past 100 s rather
    // than shrinking this read.
    await expect(this._promptInput).toBeVisible({ timeout: 20000 })
    return this
  }

  @boxedStep
  async fillPrompt(campTitle: string) {
    await this._promptInput.fill(campTitle)
    return this
  }

  @boxedStep
  async submit() {
    // The app fires the delete and forgets it: DialogBase.del() calls api.del() and emits
    // 'submit' synchronously, before that promise settles
    // (frontend/src/components/dialog/DialogBase.vue:116-123), and CampDangerZone pushes the
    // camps route on that emit (CampDangerZone.vue:33), so the DELETE is still in flight when
    // this returns. The page.goto('/camps') in Camp.delete() then unloads the document and
    // aborts it, and the next GET /api/camps still lists the camp. Run 36409935064 job
    // 108888349377 (chromium repeat 16) ended "1 failed" / "11 passed (44.9s)" on
    // expect(locator).toBeHidden() for getByText('manual prototype h726E') with the element
    // still visible, and the Playwright trace in that run's playwright-report-16 artifact
    // records DELETE /api/camps/eaac11c694be with "status": -1. The waiter is armed before the
    // click on purpose: the emit that starts the DELETE also starts the navigation, so a waiter
    // armed after the click could lose the race with the document unload. The predicate shape
    // and the rejection-handler idiom are the ones CreateCampDialogStep2.submit() uses for its
    // POST /api/camps.
    // response.ok() is part of the predicate so a rejected delete is named here: matching on
    // method and path alone lets a 4xx/5xx answer resolve the waiter, and the failure then
    // surfaces three steps later on the camp still being listed.
    const isDeleteCamp = (response: Response) =>
      response.request().method() === 'DELETE' &&
      new URL(response.url()).pathname.startsWith('/api/camps/') &&
      response.ok()
    const deleted = this._page.waitForResponse(isDeleteCamp, { timeout: 15000 })
    // Keeps a timeout from rejecting a promise nobody listens to if the click throws.
    deleted.catch(() => undefined)
    await this._deleteButton.click({ timeout: 10_000 })
    await deleted
    await this._page.waitForURL(/\/camps$/, { timeout: 15000 })
  }
}
