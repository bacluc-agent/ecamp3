import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { CreateCampDialogStep1 } from '@/utils/fixtures/pageObjects/createCamp/createCampDialogStep1'

export type CampListPageFixtureType = {
  camplistPage: CampListPage
}

// noinspection JSUnusedGlobalSymbols
export const camplistPageFixture = {
  camplistPage: async (
    { page }: { page: Page },
    use: (a: CampListPageFixtureType['camplistPage']) => Promise<void>
  ) => {
    await use(new CampListPage(page))
  },
}

export class CampListPage {
  constructor(
    private readonly _page: Page,
    private readonly _createCampButton = _page.getByTestId('create-camp-button'),
    private readonly _campListSkeletons = _page.locator('.v-skeleton-loader')
  ) {}

  @boxedStep
  async goto() {
    await this._page.goto('/camps')
    return this.loaded()
  }

  @boxedStep
  async loaded() {
    // Both assertions are pure reads, so unlike the click below they can be retried with no risk
    // of a second side effect. LoginPage.loginToCampList calls this the moment the submit button
    // is clicked, while the client side redirect to /camps is still in flight, so a slow first
    // render failed the whole spec on a single 15 s expect (run 36394159617 job 108848061633
    // step 15, webkit repeat 9: create-camp-button "element(s) not found" twice, in the step
    // CreateCamp.openStep2 > LoginPage.loginToCampList > CampListPage.loaded). Retried here
    // rather than at a call site so goto(), openCreateCampDialog() and loginToCampList() all get
    // the same budget, and so the click below keeps its own URL guard as the only rule it needs.
    // The retry helper defaults its own timeout to 0 and ignores expect.timeout, so the 30 s retry
    // budget is explicit and the 10 s per-attempt timeout stays below it, otherwise the first
    // attempt would swallow the whole budget and the retry would buy nothing.
    await expect(async () => {
      await expect(this._createCampButton).toBeVisible({ timeout: 10_000 })
      // The create button is rendered outside the loading block, so it is clickable while the camp
      // list still grows; the list then shifts under the click and the click is lost. Same gate as
      // staleDeployment.spec.ts.
      await expect(this._campListSkeletons).toHaveCount(0, { timeout: 10_000 })
    }).toPass({ timeout: 30_000 })
    return this
  }

  @boxedStep
  async openCreateCampDialog() {
    const createCampDialogStep1 = new CreateCampDialogStep1(this._page)
    await this.loaded()
    // /camps/create lazy-loads views/CampCreate.vue, so toHaveURL resolves while the route
    // component is still being fetched and the step-1 form does not exist yet (run
    // 36329007565 job 108647330128: toHaveURL passed, then CreateCampDialogStep1.loaded
    // timed out on create-camp-title-input). The create button is a button-add :to
    // router-link inside the Camps view, which unmounts on the route change, so re-clicking
    // it once the URL already matches would block on a destroyed element for the whole
    // retry budget instead of retrying anything: only click again while still on /camps.
    // toPass sets ONE deadline for the whole block, never reads expect.timeout, and catches a
    // thrown attempt to poll again, so a failed attempt costs only its first failing wait and
    // the budget buys attempts, not one attempt. The cheapest failure here is the 10 s click,
    // so 70 s is seven attempts where 30 s was three.
    await expect(async () => {
      if (!/\/camps\/create/.test(this._page.url())) {
        await this._createCampButton.click({ timeout: 10000 })
      }
      await expect(this._page).toHaveURL(/\/camps\/create/, { timeout: 10000 })
      await createCampDialogStep1.loaded()
    }).toPass({ timeout: 70000 })

    return createCampDialogStep1
  }

  @boxedStep
  async expectCampNotListed(campTitle: string) {
    await expect(this._page.getByText(campTitle)).toBeHidden()
    return this
  }
}
