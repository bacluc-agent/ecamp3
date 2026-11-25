import { expect, Locator, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { DialogDeletePeriod } from '@/utils/fixtures/pageObjects/camp/admin/dialogDeletePeriod'

const germanLongDate = (date: Date) =>
  new Intl.DateTimeFormat('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)

const germanShortMonth = (date: Date) =>
  new Intl.DateTimeFormat('de-CH', { month: 'short' }).format(date)

export class PeriodList {
  constructor(
    private readonly _page: Page,
    private readonly _campId: string,
    private readonly _createButton = _page.getByRole('button', {
      name: /Lagerabschnitt erstellen/i,
    }),
    private readonly _contentGroup = _page
      .locator('.ec-content-group')
      .filter({ has: _createButton })
  ) {}

  @boxedStep
  async goto() {
    await this._page.goto(`/camps/${this._campId}/admin/info`)
    await expect(this._createButton).toBeVisible()
    return this
  }

  private period(description: string) {
    return this._contentGroup.getByRole('listitem').filter({ hasText: description })
  }

  @boxedStep
  async onlyPeriodDescription() {
    const periods = this._contentGroup.getByRole('listitem')
    await expect(periods).toHaveCount(1)
    return periods.locator('.v-list-item-title').innerText()
  }

  /** Picking from the popup commits the value immediately; typing only commits after a debounce. */
  private async pickDate(dialog: Locator, label: string, date: Date) {
    await dialog
      .getByLabel(label)
      .locator('xpath=ancestor::*[contains(@class, "e-picker-base")][1]')
      .getByRole('button', { name: /Dialog öffnen, um ein Datum/ })
      .click()
    const picker = dialog.locator('.v-date-picker')
    for (let i = 0; i < 24; i++) {
      const month = await picker
        .getByRole('button', { name: 'Monat auswählen' })
        .innerText()
      const year = await picker
        .getByRole('button', { name: 'Jahr auswählen' })
        .innerText()
      if (
        month.includes(germanShortMonth(date)) &&
        year.includes(String(date.getFullYear()))
      ) {
        break
      }
      await picker.getByRole('button', { name: 'Nächster Monat' }).click()
    }
    // While the picker animates to another month, both month grids are rendered and show the
    // same day, so take the first instead of hitting a strict mode violation.
    await picker
      .getByRole('button', { name: germanLongDate(date) })
      .first()
      .click()
    await expect(dialog.getByLabel(label)).toHaveValue(
      new Intl.DateTimeFormat('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date)
    )
  }

  @boxedStep
  async create(description: string, start: Date, end: Date) {
    await this._createButton.click()
    const dialog = this._page.locator('.v-overlay--active')
    await dialog.getByLabel('Beschreibung').fill(description)
    await this.pickDate(dialog, 'Von', start)
    await this.pickDate(dialog, 'Bis', end)
    await dialog.getByRole('button', { name: /Erstellen/i }).click()
    await expect(this.period(description)).toBeVisible()
    return this
  }

  @boxedStep
  async openDelete(description: string, { waitForPrompt = true } = {}) {
    const item = this.period(description)
    await item.getByRole('button').click()
    await this._page
      .locator('.v-overlay--active')
      .getByText('Löschen', { exact: true })
      .click()
    const dialog = new DialogDeletePeriod(this._page)
    if (waitForPrompt) {
      await dialog.loaded()
    } else {
      await expect(dialog.deleteButton).toBeVisible()
    }
    return dialog
  }

  async expectVisible(description: string) {
    await expect(this.period(description)).toBeVisible()
    return this
  }

  async expectHidden(description: string) {
    await expect(this.period(description)).toBeHidden()
    return this
  }
}
