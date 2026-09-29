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
    const dialog = new DialogDeleteCamp(this._page)
    // The activator click is inside the retry now, bounded for the same reason every
    // other action in a block on this branch is: playwright.config.ts sets no
    // actionTimeout, so this click ran to the test's own deadline and a lost one
    // surfaced as a bare test timeout with no call log, stranding the teardown delete
    // and the camp with it. It is guarded, not plain, because the title is a toggle:
    // VExpansionPanelTitle renders a <button> whose aria-expanded is bound to the
    // panel's isSelected and whose onClick is useGroupItem's toggle,
    // group.select(id, !isSelected) (vuetify 3.13.4, VExpansionPanelTitle.mjs and
    // composables/group.js:73), so a blind retry click would collapse the panel it
    // just opened. The read carries the click's own 10 s for the same reason: with no
    // actionTimeout an unbounded getAttribute would sit on a title that never renders
    // until the test's own deadline, which is the bare timeout this block exists to
    // remove. The comparison is !== 'true' and not === 'false' so a title that carries
    // no aria-expanded at all is clicked instead of the block ending on a read that can
    // never succeed. One attempt is now 10 s activator + 10 s button + 10 s click + 20 s
    // dialog.loaded() = 50 s, so 60 s is that attempt plus slack; the button click keeps
    // the dialog.isVisible() guard it already had.
    await expect(async () => {
      const expanded = await this._dangerZoneTitle.getAttribute('aria-expanded', {
        timeout: 10_000,
      })
      if (expanded !== 'true') {
        await this._dangerZoneTitle.click({ timeout: 10_000 })
      }
      await expect(this._deleteCampButton).toBeVisible({ timeout: 10_000 })
      if (!(await dialog.dialog.isVisible())) {
        await this._deleteCampButton.click({ timeout: 10_000 })
      }
      await dialog.loaded()
    }).toPass({ timeout: 60_000 })

    return dialog
  }

  get campId(): string {
    return this._campId
  }

  get titleField(): Locator {
    return this._titleField
  }
}
