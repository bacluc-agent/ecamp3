import { expect, Locator, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export class DialogCollaboratorBulkInvite {
  constructor(
    private readonly _page: Page,
    // The bulk invite dialog is rendered as a v-dialog, while `.v-overlay--active`
    // alone also matches the navigation drawer and other overlays on the page.
    private readonly _dialog = _page.locator('.v-dialog.v-overlay--active'),
    // The dialog only holds the e-mail textarea, so the bare textbox role is enough.
    private readonly _emailsInput = _dialog.getByRole('textbox'),
    // The value assertion needs the field by label, otherwise it would also match
    // any textbox that gets added to the dialog later.
    private readonly _emailsInputByLabel = _dialog.getByRole('textbox', {
      name: 'E-Mail-Adressen',
    }),
    // The role select renders as a combobox; its accessible name carries the
    // label plus decoration, so it is matched by a regex.
    private readonly _roleSelect = _dialog.getByRole('combobox', { name: /Rolle/ }),
    private readonly _submitButton = _dialog.getByRole('button', {
      name: 'Einladungen verschicken',
    }),
    // Unfiltered, so the success alert can be asserted by its content instead of
    // by position, which differs between the success and the failed result.
    private readonly _alerts = _dialog.locator('.v-alert')
  ) {}

  @boxedStep
  async loaded() {
    await expect(this._dialog).toBeVisible()
    await expect(this._emailsInput).toBeVisible()
    return this
  }

  @boxedStep
  async fillEmails(value: string) {
    await this._emailsInput.fill(value)
    return this
  }

  @boxedStep
  async submit() {
    await this._submitButton.click()
    return this
  }

  @boxedStep
  async close() {
    await this._page.keyboard.press('Escape')
    return this
  }

  alertFor(email: string): Locator {
    return this._dialog.getByRole('alert').filter({ hasText: email })
  }

  get overlay(): Locator {
    return this._dialog
  }

  get emailsInput(): Locator {
    return this._emailsInput
  }

  get emailsInputByLabel(): Locator {
    return this._emailsInputByLabel
  }

  get roleSelect(): Locator {
    return this._roleSelect
  }

  get submitButton(): Locator {
    return this._submitButton
  }

  get successAlert(): Locator {
    return this._alerts
  }
}
