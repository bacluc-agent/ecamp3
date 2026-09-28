import { expect, Locator, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { DialogDeleteCamp } from '@/utils/fixtures/pageObjects/camp/admin/dialogDeleteCamp'

export class CampInfo {
  static readonly ROUTE = '/admin/info'

  constructor(
    private readonly _page: Page,
    private readonly _campId: string,
    private readonly _titleField = _page.locator('[data-testid="title"] input'),
    private readonly _dangerZoneTitle = _page
      .locator('.v-expansion-panel')
      .filter({ hasText: 'Gefahrenzone' })
      .locator('.v-expansion-panel-title'),
    private readonly _deleteCampButton = _page
      .locator('.v-expansion-panel-text')
      .getByRole('button', { name: /Löschen/i })
  ) {}

  async goto() {
    await this._page.goto(`/camps/${this._campId}${CampInfo.ROUTE}`)
    await this.loaded()
    return this
  }

  async loaded() {
    // admin/info is a lazily imported route chunk (frontend/src/router.js:478-481), and both
    // callers reach this read straight after a URL/navigation wait that resolves while the
    // chunk is still fetching — the class of run 36329007565 (campListPage.ts:59-61) — so the
    // pure read gets a failure budget instead of the config's 15 s.
    await expect(this._titleField).toBeVisible({ timeout: 45_000 })
  }

  @boxedStep
  async openDeleteDialog() {
    await this._dangerZoneTitle.click()

    const dialog = new DialogDeleteCamp(this._page)
    // The activator click stays outside this retry: the panel title is a toggle and a second
    // click would collapse the panel again. The button click inside the retry is guarded the
    // same way closeClipboardInfoDialog() guards its own, because DialogDeleteCamp.loaded()
    // can in principle fail with the overlay still up -- the prompt input rendering later than
    // the overlay is a product bug -- and an unguarded re-click would then be dispatched at a
    // button under the overlay. A dialog that opens without its input still fails after 40 s.
    await expect(async () => {
      await expect(this._deleteCampButton).toBeVisible({ timeout: 10_000 })
      if (!(await dialog.dialog.isVisible())) {
        await this._deleteCampButton.click({ timeout: 10_000 })
      }
      await dialog.loaded()
    }).toPass({ timeout: 40_000 })

    return dialog
  }

  get campId(): string {
    return this._campId
  }

  get titleField(): Locator {
    return this._titleField
  }
}
