import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { CreateCampDialogStep2 } from '@/utils/fixtures/pageObjects/createCamp/createCampDialogStep2'

export class CreateCampDialogStep1 {
  constructor(
    private readonly _page: Page,
    _form = _page.locator('form'),
    private readonly _titleInput = _form.locator(
      '[data-testid="create-camp-title-input"] input'
    ),
    private readonly _startInput = _form.locator(
      '[data-testid="start-date-picker"] input'
    ),
    private readonly _endInput = _form.locator('[data-testid="end-date-picker"] input'),
    private readonly _nextButton = _form.getByTestId('create-camp-next-step')
  ) {}

  @boxedStep
  async loaded() {
    await expect(this._titleInput).toBeVisible()
    await expect(this._startInput).toBeVisible()
    await expect(this._endInput).toBeVisible()
    return this
  }

  @boxedStep
  async fillForm(start: Date, end: Date, title: string) {
    await this._titleInput.fill(title)
    await this._startInput.fill(start.toLocaleDateString('de-CH'))
    await this._endInput.fill(end.toLocaleDateString('de-CH'))
    return this
  }

  @boxedStep
  async next() {
    // The continue button only exists once the form is dirty and valid, and the date pickers
    // debounce their input, so it can still be swapped out when the click starts. The click is
    // guarded on the step-1 form still being the visible step, because after a landed click the
    // button never comes back: waiting for it again would spend the budget on a dead element
    // while it is step 2's render that is slow, so every attempt re-polls step 2, and a lost
    // click is still re-clicked while step 1 is on screen. toPass sets ONE deadline for the
    // whole block, never reads expect.timeout, and catches a thrown attempt to poll again, so a
    // failed attempt costs only its first failing wait: the cheapest failure here is the 10 s
    // toBeVisible, so 45 s is four attempts where 30 s was three.
    const createCampDialogStep2 = new CreateCampDialogStep2(this._page)
    await expect(async () => {
      if (await this._titleInput.isVisible()) {
        await expect(this._nextButton).toBeVisible({ timeout: 10000 })
        await this._nextButton.click({ timeout: 10000 })
      }
      await createCampDialogStep2.loaded()
    }).toPass({ timeout: 45000 })

    return createCampDialogStep2
  }
}
