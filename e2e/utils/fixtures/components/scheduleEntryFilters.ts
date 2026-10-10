import { Page } from '@playwright/test'
import { SelectFilter } from '@/utils/fixtures/components/selectFilter'

export class ScheduleEntryFilters {
  constructor(private readonly _page: Page) {}

  get category(): SelectFilter {
    return new SelectFilter(this._page, 'Kategorie')
  }

  get responsible(): SelectFilter {
    return new SelectFilter(this._page, 'Verantwortlich')
  }

  get progressLabel(): SelectFilter {
    return new SelectFilter(this._page, 'Status')
  }
}
