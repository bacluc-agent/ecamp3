import { afterEach, describe, expect, it } from 'vitest'
import { fallbackLocales, i18n } from '@/plugins/i18n'

const originalLanguages = navigator.languages

afterEach(() => {
  Object.defineProperty(navigator, 'languages', {
    value: originalLanguages,
    configurable: true,
  })
})

describe('browserPreferredLocale', () => {
  it('returns the first default fallback when no browser locale matches', () => {
    Object.defineProperty(navigator, 'languages', { value: ['zz'], configurable: true })

    expect(i18n.browserPreferredLocale).toBe(fallbackLocales.default[0])
  })
})
