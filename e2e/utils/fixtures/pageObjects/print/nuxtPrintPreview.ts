import { Locator, Page } from '@playwright/test'
import { boxedStep } from '@/utils/decorators/boxedStep'

export const nuxtPrintPreviewFixture = {
  nuxtPrintPreview: async (
    { page }: { page: Page },
    use: (a: NuxtPrintPreviewFixtureType['nuxtPrintPreview']) => Promise<void>
  ) => {
    await use(new NuxtPrintPreview(page))
  },
}

export type NuxtPrintPreviewFixtureType = {
  nuxtPrintPreview: NuxtPrintPreview
}

export class NuxtPrintPreview {
  static readonly PRINT_URL = process.env.PRINT_URL || 'http://localhost:3000/print'

  constructor(
    private readonly _page: Page,
    private readonly _coverTitle = _page.locator('#content_0_cover')
  ) {}

  @boxedStep
  async open(printConfig: object) {
    await this._page.goto(
      `${NuxtPrintPreview.PRINT_URL}/?config=${encodeURIComponent(
        JSON.stringify(printConfig)
      )}`
    )
    return this
  }

  get body(): Locator {
    return this._page.locator('body')
  }

  get coverTitle(): Locator {
    return this._coverTitle
  }
}
