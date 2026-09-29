import { expect, Locator } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export class ESelect {
  constructor(
    private readonly _locator: Locator,
    private readonly _selectOpenLocator = _locator.page().locator('.v-overlay--active'),
    // "Nothing is left open" is a page-wide claim, so the locator is page-wide too.
    // .v-overlay--active matches every mounted overlay whatever its role, and :not(.v-dialog)
    // drops only the clipboard info dialog, which DialogForm.vue:2 renders as a v-dialog and
    // which belongs to a later step of this same flow. Scoping this to the select's own menu
    // would make it vacuous rather than merely narrower: v-overlay--active is exactly the class
    // the menu loses when it closes, so the locator could only ever match zero elements, and
    // toBeHidden() passes on zero matches.
    private readonly _selectClosedLocator = _locator
      .page()
      .locator('.v-overlay--active:not(.v-dialog)')
  ) {}

  @boxedStep
  async open() {
    // The click stays outside the retry in select() on purpose: it opens the select, so a retry
    // that re-clicked it would close the menu it just opened.
    await this._locator.click()
    await expect(this._selectOpenLocator).toBeVisible()
    return this
  }

  @boxedStep
  async select(value: string) {
    // The clipboard info dialog is not one of the overlays that could be left open: camp.ts:110-113
    // opens it only after this returns, and a never-opened v-dialog has no content to mount. So
    // the closed check is deliberately page-wide while the option is scoped to the active
    // overlay: what has to be proven is that no overlay at all is left open. The submit button's
    // v-tooltip, the v-else of CampCreateStep2.vue:183-190, is eager and its root is mounted
    // from the start, but it carries no .v-overlay--active until it is hovered (vuetify 3.13.4
    // VOverlay.mjs:278 binds v-overlay--active to the proxied modelValue, not to hasContent),
    // so it cannot keep this block open either.
    // The option text is a translation, so assert it separately: without this a renamed option
    // burns the whole test timeout on a click that can never land, and the failure says nothing
    // about which part of the dialog broke.
    const option = this._selectOpenLocator.getByText(value, { exact: true })
    // toPass sets ONE deadline for the whole block, never reads expect.timeout, and catches a
    // thrown attempt to poll again, so a failed attempt costs only its first failing wait and
    // the budget buys attempts, not one attempt. The cheapest possible first failure here is the
    // 10 s click, not the 15 s reads, so 45 s is four attempts and 30 s was three. The action
    // keeps its own 10 s for a different reason: the block's deadline races the whole attempt
    // (playwright/lib/matchers/expect.js:13025 takes min(testDeadline-250, startTime+timeout)),
    // so an unbounded click is abandoned at 45 s with no result and the failure is only "Timeout
    // 45000ms exceeded while waiting on the predicate", with no call log naming the click.
    // Bounded, the click throws inside the attempt, 35 s of budget is left to retry, and the
    // reported message is the click's own.
    await expect(async () => {
      // The click is guarded on the menu still being open, not just on the option being
      // visible: the closed locator can be visible because the menu closed while another
      // non-dialog overlay is active, and an unguarded attempt then aborts on
      // expect(option).toBeVisible() and reports "Timeout 45000ms exceeded while waiting on the
      // predicate" instead of naming the overlay that is still open. Same idiom as
      // closeClipboardInfoDialog() and campInfo's delete click. A lost click is still retried
      // while the menu is open, and never re-clicked once it is closed. The gate must NOT be on
      // the option: that is a non-polling derived fact, false both when the menu never opened
      // and when the menu is open but the option has not mounted yet, and the second case would
      // wait the option into view and then close the block without ever clicking.
      if (await this._selectClosedLocator.isVisible()) {
        await expect(option).toBeVisible()
        await option.click({ timeout: 10000 })
      }
      await expect(this._selectClosedLocator).toBeHidden()
    }).toPass({ timeout: 45000 })

    return this
  }

  get locator(): Locator {
    return this._locator
  }
}
