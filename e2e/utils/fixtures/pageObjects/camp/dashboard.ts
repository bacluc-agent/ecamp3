import { expect, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'
import { ScheduleEntryFilters } from '@/utils/fixtures/components/scheduleEntryFilters'

export class CampDashboard {
  constructor(
    private readonly _page: Page,
    private readonly _periodLink = _page.getByRole('link', { name: 'Hauptlager' })
  ) {}

  @boxedStep
  async loaded() {
    await expect(this._periodLink).toBeVisible()
    return this
  }

  @boxedStep
  async reload() {
    await this._page.reload()
    return this
  }

  get filters(): ScheduleEntryFilters {
    return new ScheduleEntryFilters(this._page)
  }
}
