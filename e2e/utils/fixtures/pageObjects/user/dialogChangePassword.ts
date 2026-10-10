import { expect, Locator, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export class DialogChangePassword {
  constructor(
    private readonly _page: Page,
    private readonly _dialog = _page.locator('.v-dialog.v-overlay--active'),
    private readonly _passwordInputs = _page.locator(
      '.v-dialog.v-overlay--active input[type="password"]'
    )
  ) {}

  @boxedStep
  async loaded() {
    await expect(this._dialog).toContainText('Passwort ändern')
    return this
  }

  @boxedStep
  async fillForm(currentPassword: string, newPassword: string) {
    await this._passwordInputs.nth(0).fill(currentPassword)
    await this._passwordInputs.nth(1).fill(newPassword)
    await this._passwordInputs.nth(2).fill(newPassword)
    return this
  }

  @boxedStep
  async submit() {
    await this._dialog.getByRole('button', { name: /Abschicken/ }).click()
    return this
  }

  @boxedStep
  async close() {
    await this._dialog.getByRole('button', { name: /Schliessen/ }).click()
    return this
  }

  successMessage(): Locator {
    return this._dialog.getByText('Dein Passwort wurde erfolgreich geändert.')
  }
}
